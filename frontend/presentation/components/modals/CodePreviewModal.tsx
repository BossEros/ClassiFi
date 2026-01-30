import Editor from "@monaco-editor/react"
import { X, Copy, Check } from "lucide-react"
import { Button } from "@/presentation/components/ui/Button"
import { useToast } from "@/shared/context/ToastContext"
import { getMonacoLanguage } from "@/shared/utils/monacoUtils"
import { useState, useEffect } from "react"

interface CodePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
  fileName: string
  language?: string
}

export function CodePreviewModal({
  isOpen,
  onClose,
  code,
  fileName,
  language = "plaintext",
}: CodePreviewModalProps) {
  const { showToast } = useToast()
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      showToast("Code copied to clipboard", "success")
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      showToast("Failed to copy code", "error")
    }
  }

  const monacoLanguage = getMonacoLanguage(language)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col transform overflow-hidden rounded-2xl bg-[#1e1e1e] shadow-2xl transition-all border border-white/10 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1e1e1e]">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-200 tracking-tight flex items-center gap-2">
                {fileName}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                {language.charAt(0).toUpperCase() + language.slice(1)} •{" "}
                {code.split("\n").length} lines
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopy}
              className="!w-auto !h-8 !px-3 font-normal text-xs !bg-transparent border border-white/10 hover:!bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                  <span className="text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy
                </>
              )}
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor Container */}
        <div className="flex-1 min-h-0 relative">
          <Editor
            height="100%"
            language={monacoLanguage}
            value={code}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 14,
              fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
              padding: { top: 16, bottom: 16 },
              lineNumbers: "on",
              renderLineHighlight: "all",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              formatOnPaste: true,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    </div>
  )
}
