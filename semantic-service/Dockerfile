FROM python:3.11-slim

WORKDIR /app

# Install CPU-only PyTorch first (separate step to leverage Docker layer cache)
RUN pip install --no-cache-dir \
    torch==2.3.1 \
    --index-url https://download.pytorch.org/whl/cpu

# Install remaining application dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download only the tokenizer and model config from HuggingFace.
# The actual fine-tuned weights are supplied at runtime via a Docker volume,
# so we avoid a redundant 380 MB base-model download here.
RUN python -c "\
from transformers import RobertaTokenizer, RobertaConfig; \
RobertaTokenizer.from_pretrained('microsoft/graphcodebert-base'); \
RobertaConfig.from_pretrained('microsoft/graphcodebert-base'); \
print('Tokenizer and config cached successfully.')"

# Copy application source
COPY app/ ./app/
COPY main.py .

EXPOSE 8001

# Single worker — model is loaded once and shared across requests in-process
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
