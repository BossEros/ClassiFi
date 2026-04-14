"""
DFG (Data Flow Graph) feature extraction for GraphCodeBERT inference.

Replicates the training-time feature pipeline so that inference uses the same
DFG-augmented attention masks that were used during fine-tuning, fixing the
train/inference mismatch in the vanilla predictor.

DFG function implementations are derived from:
  microsoft/CodeBERT — GraphCodeBERT/codesearch/parser/DFG.py  (MIT license)
  microsoft/CodeBERT — GraphCodeBERT/codesearch/parser/utils.py (MIT license)

Feature engineering is derived from:
  notebook.ipynb cells 13, 18, 19 (convert_examples_to_features / build_attn_mask)
"""

import logging
import re
import threading
import tokenize as tokenize_module
from io import StringIO

import numpy as np

logger = logging.getLogger(__name__)

# ── Constants (must match training args: code_length=256, data_flow_length=64) ─
CODE_LENGTH = 256
DATA_FLOW_LENGTH = 64
SEQUENCE_LENGTH = CODE_LENGTH + DATA_FLOW_LENGTH  # 320

# Numerical stability constant for DFG node embedding averaging
EPSILON = 1e-10

# ── Languages with DFG support ────────────────────────────────────────────────
SUPPORTED_LANGUAGES = frozenset({"python", "java", "c"})

# ── Module-level parser cache (each parser is [TSParser, dfg_fn]) ─────────────
_parsers: dict | None = None
_parsers_lock = threading.Lock()


def get_parsers() -> dict:
    """Lazily initialize tree-sitter parsers using the tree-sitter-languages package."""
    global _parsers

    if _parsers is not None:
        return _parsers

    with _parsers_lock:
        if _parsers is not None:
            return _parsers

        try:
            from tree_sitter_languages import get_parser as ts_get_parser

            _parsers = {
                "python": [ts_get_parser("python"), DFG_python],
                "java":   [ts_get_parser("java"),   DFG_java],
                "c":      [ts_get_parser("c"),       DFG_c],
            }
            logger.info("DFG parsers initialised for: %s", list(_parsers.keys()))
        except Exception as exc:
            logger.warning("tree-sitter-languages unavailable (%s) — DFG encoding disabled", exc)
            _parsers = {}

    return _parsers


# ── Utilities (from GraphCodeBERT parser/utils.py, MIT license) ───────────────

def remove_comments_and_docstrings(source: str, lang: str) -> str:
    """Remove inline comments and docstrings from source code."""
    if lang == "python":
        try:
            io_obj = StringIO(source)
            out = ""
            prev_toktype = tokenize_module.INDENT
            last_lineno = -1
            last_col = 0

            for tok in tokenize_module.generate_tokens(io_obj.readline):
                token_type, token_string = tok[0], tok[1]
                start_line, start_col = tok[2]
                end_line, end_col = tok[3]

                if start_line > last_lineno:
                    last_col = 0
                if start_col > last_col:
                    out += " " * (start_col - last_col)

                if token_type == tokenize_module.COMMENT:
                    pass
                elif token_type == tokenize_module.STRING:
                    if prev_toktype != tokenize_module.INDENT:
                        if prev_toktype != tokenize_module.NEWLINE:
                            if start_col > 0:
                                out += token_string
                else:
                    out += token_string

                prev_toktype = token_type
                last_col = end_col
                last_lineno = end_line

            return "\n".join(line for line in out.split("\n") if line.strip())
        except Exception:
            return source

    elif lang == "ruby":
        return source

    else:
        def _replace_comment(match):
            return " " if match.group(0).startswith("/") else match.group(0)

        pattern = re.compile(
            r'//.*?$|/\*.*?\*/|\'(?:\\.|[^\\\'])*\'|"(?:\\.|[^\\"])*"',
            re.DOTALL | re.MULTILINE,
        )
        return "\n".join(
            line for line in re.sub(pattern, _replace_comment, source).split("\n") if line.strip()
        )


def tree_to_token_index(root_node) -> list:
    """Convert a tree-sitter AST into a flat list of (start_point, end_point) positions."""
    if (len(root_node.children) == 0 or root_node.type == "string") and root_node.type != "comment":
        return [(root_node.start_point, root_node.end_point)]

    tokens = []
    for child in root_node.children:
        tokens += tree_to_token_index(child)
    return tokens


def tree_to_variable_index(root_node, index_to_code: dict) -> list:
    """Return positions of identifier/variable nodes in the AST."""
    if (len(root_node.children) == 0 or root_node.type == "string") and root_node.type != "comment":
        index = (root_node.start_point, root_node.end_point)
        _, code = index_to_code[index]
        if root_node.type != code:
            return [(root_node.start_point, root_node.end_point)]
        return []

    tokens = []
    for child in root_node.children:
        tokens += tree_to_variable_index(child, index_to_code)
    return tokens


def index_to_code_token(index: tuple, code_lines: list) -> str:
    """Extract the token string from code lines using a (start_point, end_point) index."""
    start_point, end_point = index[0], index[1]

    if start_point[0] == end_point[0]:
        return code_lines[start_point[0]][start_point[1]:end_point[1]]

    s = code_lines[start_point[0]][start_point[1]:]
    for i in range(start_point[0] + 1, end_point[0]):
        s += code_lines[i]
    s += code_lines[end_point[0]][:end_point[1]]
    return s


# ── DFG extraction functions (from GraphCodeBERT parser/DFG.py, MIT license) ──

def DFG_python(root_node, index_to_code: dict, states: dict):
    """Extract data flow graph edges for Python code."""
    assignment = ["assignment", "augmented_assignment", "for_in_clause"]
    if_statement = ["if_statement"]
    for_statement = ["for_statement"]
    while_statement = ["while_statement"]
    do_first_statement = ["for_in_clause"]
    def_statement = ["default_parameter"]
    states = states.copy()

    if (len(root_node.children) == 0 or root_node.type == "string") and root_node.type != "comment":
        idx, code = index_to_code[(root_node.start_point, root_node.end_point)]
        if root_node.type == code:
            return [], states
        if code in states:
            return [(code, idx, "comesFrom", [code], states[code].copy())], states
        if root_node.type == "identifier":
            states[code] = [idx]
        return [(code, idx, "comesFrom", [], [])], states

    if root_node.type in def_statement:
        name = root_node.child_by_field_name("name")
        value = root_node.child_by_field_name("value")
        dfg = []
        if value is None:
            for index in tree_to_variable_index(name, index_to_code):
                idx, code = index_to_code[index]
                dfg.append((code, idx, "comesFrom", [], []))
                states[code] = [idx]
            return sorted(dfg, key=lambda x: x[1]), states
        name_idxs = tree_to_variable_index(name, index_to_code)
        value_idxs = tree_to_variable_index(value, index_to_code)
        temp, states = DFG_python(value, index_to_code, states)
        dfg += temp
        for i1 in name_idxs:
            idx1, c1 = index_to_code[i1]
            for i2 in value_idxs:
                idx2, c2 = index_to_code[i2]
                dfg.append((c1, idx1, "comesFrom", [c2], [idx2]))
            states[c1] = [idx1]
        return sorted(dfg, key=lambda x: x[1]), states

    if root_node.type in assignment:
        if root_node.type == "for_in_clause":
            right_nodes = [root_node.children[-1]]
            left_nodes = [root_node.child_by_field_name("left")]
        else:
            if root_node.child_by_field_name("right") is None:
                return [], states
            left_nodes = [x for x in root_node.child_by_field_name("left").children if x.type != ","]
            right_nodes = [x for x in root_node.child_by_field_name("right").children if x.type != ","]
            if len(right_nodes) != len(left_nodes):
                left_nodes = [root_node.child_by_field_name("left")]
                right_nodes = [root_node.child_by_field_name("right")]
            if not left_nodes:
                left_nodes = [root_node.child_by_field_name("left")]
            if not right_nodes:
                right_nodes = [root_node.child_by_field_name("right")]
        dfg = []
        for node in right_nodes:
            temp, states = DFG_python(node, index_to_code, states)
            dfg += temp
        for left_node, right_node in zip(left_nodes, right_nodes):
            l_idxs = tree_to_variable_index(left_node, index_to_code)
            r_idxs = tree_to_variable_index(right_node, index_to_code)
            for i1 in l_idxs:
                idx1, c1 = index_to_code[i1]
                dfg.append((c1, idx1, "computedFrom",
                             [index_to_code[x][1] for x in r_idxs],
                             [index_to_code[x][0] for x in r_idxs]))
                states[c1] = [idx1]
        return sorted(dfg, key=lambda x: x[1]), states

    if root_node.type in if_statement:
        dfg, current_states, others_states, tag = [], states.copy(), [], False
        if "else" in root_node.type:
            tag = True
        for child in root_node.children:
            if "else" in child.type:
                tag = True
            if child.type not in ["elif_clause", "else_clause"]:
                temp, current_states = DFG_python(child, index_to_code, current_states)
                dfg += temp
            else:
                temp, new_states = DFG_python(child, index_to_code, states)
                dfg += temp
                others_states.append(new_states)
        others_states.append(current_states)
        if not tag:
            others_states.append(states)
        new_states = {}
        for d in others_states:
            for k, v in d.items():
                new_states[k] = sorted(set(new_states.get(k, []) + v))
        return sorted(dfg, key=lambda x: x[1]), new_states

    if root_node.type in for_statement:
        dfg = []
        for _ in range(2):
            right_nodes = [x for x in root_node.child_by_field_name("right").children if x.type != ","]
            left_nodes = [x for x in root_node.child_by_field_name("left").children if x.type != ","]
            if len(right_nodes) != len(left_nodes):
                left_nodes = [root_node.child_by_field_name("left")]
                right_nodes = [root_node.child_by_field_name("right")]
            if not left_nodes:
                left_nodes = [root_node.child_by_field_name("left")]
            if not right_nodes:
                right_nodes = [root_node.child_by_field_name("right")]
            for node in right_nodes:
                temp, states = DFG_python(node, index_to_code, states)
                dfg += temp
            for left_node, right_node in zip(left_nodes, right_nodes):
                l_idxs = tree_to_variable_index(left_node, index_to_code)
                r_idxs = tree_to_variable_index(right_node, index_to_code)
                for i1 in l_idxs:
                    idx1, c1 = index_to_code[i1]
                    dfg.append((c1, idx1, "computedFrom",
                                 [index_to_code[x][1] for x in r_idxs],
                                 [index_to_code[x][0] for x in r_idxs]))
                    states[c1] = [idx1]
            if root_node.children[-1].type == "block":
                temp, states = DFG_python(root_node.children[-1], index_to_code, states)
                dfg += temp
        return _dedup_dfg(dfg), states

    if root_node.type in while_statement:
        dfg = []
        for _ in range(2):
            for child in root_node.children:
                temp, states = DFG_python(child, index_to_code, states)
                dfg += temp
        return _dedup_dfg(dfg), states

    dfg = []
    for child in root_node.children:
        if child.type in do_first_statement:
            temp, states = DFG_python(child, index_to_code, states)
            dfg += temp
    for child in root_node.children:
        if child.type not in do_first_statement:
            temp, states = DFG_python(child, index_to_code, states)
            dfg += temp
    return sorted(dfg, key=lambda x: x[1]), states


def DFG_java(root_node, index_to_code: dict, states: dict):
    """Extract data flow graph edges for Java code."""
    assignment = ["assignment_expression"]
    def_statement = ["variable_declarator"]
    increment_statement = ["update_expression"]
    if_statement = ["if_statement", "else"]
    for_statement = ["for_statement"]
    enhanced_for_statement = ["enhanced_for_statement"]
    while_statement = ["while_statement"]
    states = states.copy()

    if (len(root_node.children) == 0 or root_node.type == "string") and root_node.type != "comment":
        idx, code = index_to_code[(root_node.start_point, root_node.end_point)]
        if root_node.type == code:
            return [], states
        if code in states:
            return [(code, idx, "comesFrom", [code], states[code].copy())], states
        if root_node.type == "identifier":
            states[code] = [idx]
        return [(code, idx, "comesFrom", [], [])], states

    if root_node.type in def_statement:
        name = root_node.child_by_field_name("name")
        value = root_node.child_by_field_name("value")
        dfg = []
        if value is None:
            for index in tree_to_variable_index(name, index_to_code):
                idx, code = index_to_code[index]
                dfg.append((code, idx, "comesFrom", [], []))
                states[code] = [idx]
            return sorted(dfg, key=lambda x: x[1]), states
        name_idxs = tree_to_variable_index(name, index_to_code)
        value_idxs = tree_to_variable_index(value, index_to_code)
        temp, states = DFG_java(value, index_to_code, states)
        dfg += temp
        for i1 in name_idxs:
            idx1, c1 = index_to_code[i1]
            for i2 in value_idxs:
                idx2, c2 = index_to_code[i2]
                dfg.append((c1, idx1, "comesFrom", [c2], [idx2]))
            states[c1] = [idx1]
        return sorted(dfg, key=lambda x: x[1]), states

    if root_node.type in assignment:
        left_nodes = root_node.child_by_field_name("left")
        right_nodes = root_node.child_by_field_name("right")
        dfg = []
        temp, states = DFG_java(right_nodes, index_to_code, states)
        dfg += temp
        name_idxs = tree_to_variable_index(left_nodes, index_to_code)
        value_idxs = tree_to_variable_index(right_nodes, index_to_code)
        for i1 in name_idxs:
            idx1, c1 = index_to_code[i1]
            for i2 in value_idxs:
                idx2, c2 = index_to_code[i2]
                dfg.append((c1, idx1, "computedFrom", [c2], [idx2]))
            states[c1] = [idx1]
        return sorted(dfg, key=lambda x: x[1]), states

    if root_node.type in increment_statement:
        dfg = []
        idxs = tree_to_variable_index(root_node, index_to_code)
        for i1 in idxs:
            idx1, c1 = index_to_code[i1]
            for i2 in idxs:
                idx2, c2 = index_to_code[i2]
                dfg.append((c1, idx1, "computedFrom", [c2], [idx2]))
            states[c1] = [idx1]
        return sorted(dfg, key=lambda x: x[1]), states

    if root_node.type in if_statement:
        dfg, current_states, others_states = [], states.copy(), []
        flag, tag = False, "else" in root_node.type
        for child in root_node.children:
            if "else" in child.type:
                tag = True
            if child.type not in if_statement and not flag:
                temp, current_states = DFG_java(child, index_to_code, current_states)
                dfg += temp
            else:
                flag = True
                temp, new_states = DFG_java(child, index_to_code, states)
                dfg += temp
                others_states.append(new_states)
        others_states.append(current_states)
        if not tag:
            others_states.append(states)
        new_states = {}
        for d in others_states:
            for k, v in d.items():
                new_states[k] = sorted(set(new_states.get(k, []) + v))
        return sorted(dfg, key=lambda x: x[1]), new_states

    if root_node.type in for_statement:
        dfg = []
        for child in root_node.children:
            temp, states = DFG_java(child, index_to_code, states)
            dfg += temp
        flag = False
        for child in root_node.children:
            if flag:
                temp, states = DFG_java(child, index_to_code, states)
                dfg += temp
            elif child.type == "local_variable_declaration":
                flag = True
        return _dedup_dfg(dfg), states

    if root_node.type in enhanced_for_statement:
        name = root_node.child_by_field_name("name")
        value = root_node.child_by_field_name("value")
        body = root_node.child_by_field_name("body")
        dfg = []
        for _ in range(2):
            temp, states = DFG_java(value, index_to_code, states)
            dfg += temp
            name_idxs = tree_to_variable_index(name, index_to_code)
            value_idxs = tree_to_variable_index(value, index_to_code)
            for i1 in name_idxs:
                idx1, c1 = index_to_code[i1]
                for i2 in value_idxs:
                    idx2, c2 = index_to_code[i2]
                    dfg.append((c1, idx1, "computedFrom", [c2], [idx2]))
                states[c1] = [idx1]
            temp, states = DFG_java(body, index_to_code, states)
            dfg += temp
        return _dedup_dfg(dfg), states

    if root_node.type in while_statement:
        dfg = []
        for _ in range(2):
            for child in root_node.children:
                temp, states = DFG_java(child, index_to_code, states)
                dfg += temp
        return _dedup_dfg(dfg), states

    dfg = []
    for child in root_node.children:
        temp, states = DFG_java(child, index_to_code, states)
        dfg += temp
    return sorted(dfg, key=lambda x: x[1]), states


def DFG_c(root_node, index_to_code: dict, states: dict):
    """Extract data flow graph edges for C code (mirrors Java with C-specific node types)."""
    assignment = ["assignment_expression"]
    def_statement = ["init_declarator"]
    increment_statement = ["update_expression"]
    if_statement = ["if_statement", "else"]
    for_statement = ["for_statement"]
    while_statement = ["while_statement"]
    states = states.copy()

    if (len(root_node.children) == 0 or root_node.type == "string") and root_node.type != "comment":
        idx, code = index_to_code.get((root_node.start_point, root_node.end_point), (0, ""))
        if not code:
            return [], states
        if root_node.type == code:
            return [], states
        if code in states:
            return [(code, idx, "comesFrom", [code], states[code].copy())], states
        if root_node.type == "identifier":
            states[code] = [idx]
        return [(code, idx, "comesFrom", [], [])], states

    if root_node.type in def_statement:
        name = root_node.child_by_field_name("declarator")
        value = root_node.child_by_field_name("value")
        dfg = []
        if name is None:
            return [], states
        if value is None:
            for index in tree_to_variable_index(name, index_to_code):
                idx, code = index_to_code[index]
                dfg.append((code, idx, "comesFrom", [], []))
                states[code] = [idx]
            return sorted(dfg, key=lambda x: x[1]), states
        name_idxs = tree_to_variable_index(name, index_to_code)
        value_idxs = tree_to_variable_index(value, index_to_code)
        temp, states = DFG_c(value, index_to_code, states)
        dfg += temp
        for i1 in name_idxs:
            idx1, c1 = index_to_code[i1]
            for i2 in value_idxs:
                idx2, c2 = index_to_code[i2]
                dfg.append((c1, idx1, "comesFrom", [c2], [idx2]))
            states[c1] = [idx1]
        return sorted(dfg, key=lambda x: x[1]), states

    if root_node.type in assignment:
        left_nodes = root_node.child_by_field_name("left")
        right_nodes = root_node.child_by_field_name("right")
        if left_nodes is None or right_nodes is None:
            return [], states
        dfg = []
        temp, states = DFG_c(right_nodes, index_to_code, states)
        dfg += temp
        name_idxs = tree_to_variable_index(left_nodes, index_to_code)
        value_idxs = tree_to_variable_index(right_nodes, index_to_code)
        for i1 in name_idxs:
            idx1, c1 = index_to_code[i1]
            for i2 in value_idxs:
                idx2, c2 = index_to_code[i2]
                dfg.append((c1, idx1, "computedFrom", [c2], [idx2]))
            states[c1] = [idx1]
        return sorted(dfg, key=lambda x: x[1]), states

    if root_node.type in increment_statement:
        dfg = []
        idxs = tree_to_variable_index(root_node, index_to_code)
        for i1 in idxs:
            idx1, c1 = index_to_code[i1]
            for i2 in idxs:
                idx2, c2 = index_to_code[i2]
                dfg.append((c1, idx1, "computedFrom", [c2], [idx2]))
            states[c1] = [idx1]
        return sorted(dfg, key=lambda x: x[1]), states

    if root_node.type in if_statement:
        dfg, current_states, others_states = [], states.copy(), []
        flag, tag = False, "else" in root_node.type
        for child in root_node.children:
            if "else" in child.type:
                tag = True
            if child.type not in if_statement and not flag:
                temp, current_states = DFG_c(child, index_to_code, current_states)
                dfg += temp
            else:
                flag = True
                temp, new_states = DFG_c(child, index_to_code, states)
                dfg += temp
                others_states.append(new_states)
        others_states.append(current_states)
        if not tag:
            others_states.append(states)
        new_states = {}
        for d in others_states:
            for k, v in d.items():
                new_states[k] = sorted(set(new_states.get(k, []) + v))
        return sorted(dfg, key=lambda x: x[1]), new_states

    if root_node.type in for_statement:
        dfg = []
        for child in root_node.children:
            temp, states = DFG_c(child, index_to_code, states)
            dfg += temp
        return _dedup_dfg(dfg), states

    if root_node.type in while_statement:
        dfg = []
        for _ in range(2):
            for child in root_node.children:
                temp, states = DFG_c(child, index_to_code, states)
                dfg += temp
        return _dedup_dfg(dfg), states

    dfg = []
    for child in root_node.children:
        temp, states = DFG_c(child, index_to_code, states)
        dfg += temp
    return sorted(dfg, key=lambda x: x[1]), states


def _dedup_dfg(dfg: list) -> list:
    """Deduplicate DFG edges that share the same (name, idx, relation) key."""
    dic = {}
    for x in dfg:
        key = (x[0], x[1], x[2])
        if key not in dic:
            dic[key] = [x[3], x[4]]
        else:
            dic[key][0] = list(set(dic[key][0] + x[3]))
            dic[key][1] = sorted(set(dic[key][1] + x[4]))
    return [(x[0], x[1], x[2], y[0], y[1]) for x, y in sorted(dic.items(), key=lambda t: t[0][1])]


# ── DFG extraction with threading timeout ─────────────────────────────────────

def _extract_dataflow_inner(code: str, lang_parser: list, lang: str) -> tuple:
    """Core DFG extraction without timeout protection."""
    try:
        code = remove_comments_and_docstrings(code, lang)
    except Exception:
        pass

    if lang == "php":
        code = "<?php" + code + "?>"

    try:
        tree = lang_parser[0].parse(bytes(code, "utf8"))
        root_node = tree.root_node
        tokens_index = tree_to_token_index(root_node)
        code_lines = code.split("\n")
        code_tokens = [index_to_code_token(x, code_lines) for x in tokens_index]

        index_to_code_map = {index: (idx, tok) for idx, (index, tok) in enumerate(zip(tokens_index, code_tokens))}

        try:
            raw_dfg, _ = lang_parser[1](root_node, index_to_code_map, {})
        except Exception:
            raw_dfg = []

        raw_dfg = sorted(raw_dfg, key=lambda x: x[1])
        referenced_indices = set()
        for edge in raw_dfg:
            if edge[-1]:
                referenced_indices.add(edge[1])
            for x in edge[-1]:
                referenced_indices.add(x)
        dfg = [edge for edge in raw_dfg if edge[1] in referenced_indices]

    except Exception:
        code_tokens, dfg = [], []

    return code_tokens, dfg


def extract_dataflow(code: str, lang_parser: list, lang: str, timeout_sec: int = 10) -> tuple:
    """
    Extract DFG edges for a code snippet with a background-thread timeout.

    Returns (code_tokens, dfg). Returns ([], []) if extraction hangs or fails.
    """
    result = [[], []]

    def _run():
        result[0], result[1] = _extract_dataflow_inner(code, lang_parser, lang)

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    thread.join(timeout=timeout_sec)

    if thread.is_alive():
        logger.warning("DFG extraction timed out (%ds) — returning empty DFG", timeout_sec)
        return [], []

    return result[0], result[1]


# ── Single-snippet feature conversion ─────────────────────────────────────────

def convert_code_to_features(code: str, language: str, tokenizer) -> dict:
    """
    Convert a single code snippet into DFG-augmented input features.

    Replicates the per-snippet logic from convert_examples_to_features() in the
    training notebook (cell 18), producing the same tensor inputs that
    Model.forward() expects.

    @param code: Raw source code string.
    @param language: One of 'python', 'java', or 'c'.
    @param tokenizer: RobertaTokenizer instance.
    @returns Dict with keys: source_ids, position_idx, dfg_to_code, dfg_to_dfg.
    @raises ValueError if the language has no available parser.
    """
    parsers = get_parsers()
    lang_parser = parsers.get(language)
    if lang_parser is None:
        raise ValueError(f"Language '{language}' not supported for DFG. Available: {list(parsers)}")

    code_tokens, dfg = extract_dataflow(code, lang_parser, language)

    # Sub-tokenize preserving word-boundary alignment (training notebook cell 18)
    sub_tokenized = [
        tokenizer.tokenize("@ " + x)[1:] if idx != 0 else tokenizer.tokenize(x)
        for idx, x in enumerate(code_tokens)
    ]

    # Build original-token → sub-token position map
    ori2cur_pos = {-1: (0, 0)}
    for i, sub in enumerate(sub_tokenized):
        ori2cur_pos[i] = (ori2cur_pos[i - 1][1], ori2cur_pos[i - 1][1] + len(sub))

    flat_code_tokens = [tok for sub in sub_tokenized for tok in sub]

    # Truncate: reserve SEQUENCE_LENGTH positions for code + DFG nodes
    dfg_budget = min(len(dfg), DATA_FLOW_LENGTH)
    max_code_tokens = CODE_LENGTH + DATA_FLOW_LENGTH - 3 - dfg_budget
    flat_code_tokens = flat_code_tokens[:max_code_tokens][:512 - 3]

    # Build [CLS] + code + [SEP] prefix
    source_tokens = [tokenizer.cls_token] + flat_code_tokens + [tokenizer.sep_token]
    source_ids = tokenizer.convert_tokens_to_ids(source_tokens)

    # position_idx for code tokens: pad_token_id+1, pad_token_id+2, …  (≥2)
    # RobertaTokenizer.pad_token_id = 1, so positions start at 2
    position_idx = [i + tokenizer.pad_token_id + 1 for i in range(len(source_tokens))]

    # Append DFG node pseudo-tokens with position_idx=0 (sentinel for DFG nodes)
    dfg = dfg[:SEQUENCE_LENGTH - len(source_tokens)]
    source_tokens += [x[0] for x in dfg]
    position_idx += [0] * len(dfg)
    source_ids += [tokenizer.unk_token_id] * len(dfg)

    # Pad the remainder to SEQUENCE_LENGTH with pad_token_id (1)
    padding_length = SEQUENCE_LENGTH - len(source_ids)
    position_idx += [tokenizer.pad_token_id] * padding_length
    source_ids += [tokenizer.pad_token_id] * padding_length

    # Re-index DFG edge targets to be relative to the DFG node block
    reverse_index = {x[1]: i for i, x in enumerate(dfg)}
    dfg = [x[:-1] + ([reverse_index[i] for i in x[-1] if i in reverse_index],) for x in dfg]

    dfg_to_dfg = [x[-1] for x in dfg]
    dfg_to_code = [ori2cur_pos[x[1]] for x in dfg]

    cls_offset = 1  # account for the [CLS] token at position 0
    dfg_to_code = [(a + cls_offset, b + cls_offset) for a, b in dfg_to_code]

    return {
        "source_ids":   source_ids,
        "position_idx": position_idx,
        "dfg_to_code":  dfg_to_code,
        "dfg_to_dfg":   dfg_to_dfg,
    }


# ── Graph-guided attention mask builder ───────────────────────────────────────

def build_attn_mask(
    position_idx: list,
    source_ids: list,
    dfg_to_code: list,
    dfg_to_dfg: list,
) -> np.ndarray:
    """
    Build the graph-guided 3D attention mask.

    Replicates TextDataset.__getitem__()'s build_attn_mask() (notebook cell 19).

    Mask rules:
      - Code tokens attend to all other code tokens (dense block).
      - CLS and SEP attend to all non-padding positions.
      - Each DFG node attends to its source code token span (bidirectional).
      - Each DFG node attends to its connected DFG neighbours.

    @param position_idx: Token position indices of length SEQUENCE_LENGTH.
    @param source_ids: Token IDs of length SEQUENCE_LENGTH.
    @param dfg_to_code: List of (start, end) code-token ranges for each DFG node.
    @param dfg_to_dfg: List of DFG-relative target indices for each DFG node.
    @returns Boolean np.ndarray of shape (SEQUENCE_LENGTH, SEQUENCE_LENGTH).
    """
    attn_mask = np.zeros((SEQUENCE_LENGTH, SEQUENCE_LENGTH), dtype=bool)

    # Code-token boundary: position_idx > 1 indicates a code token
    node_index = sum(1 for i in position_idx if i > 1)
    # Last non-padding position: position_idx != 1 (pad_token_id)
    max_length = sum(1 for i in position_idx if i != 1)

    # Dense self-attention among all code tokens
    attn_mask[:node_index, :node_index] = True

    # CLS (id=0) and SEP (id=2) attend to all non-padding positions
    for idx, token_id in enumerate(source_ids):
        if token_id in (0, 2):
            attn_mask[idx, :max_length] = True

    # DFG nodes ↔ originating code tokens (bidirectional)
    for idx, (start, end) in enumerate(dfg_to_code):
        if start < node_index and end < node_index:
            attn_mask[idx + node_index, start:end] = True
            attn_mask[start:end, idx + node_index] = True

    # DFG nodes → connected DFG neighbours
    for idx, neighbours in enumerate(dfg_to_dfg):
        for neighbour in neighbours:
            target = neighbour + node_index
            if target < SEQUENCE_LENGTH:
                attn_mask[idx + node_index, target] = True

    return attn_mask
