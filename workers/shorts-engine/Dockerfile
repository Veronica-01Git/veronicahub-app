FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home shorts
USER shorts
# Bake the Whisper model into the image: scale-to-zero instances start without
# re-downloading ~0.5 GB on every cold start.
ARG WHISPER_MODEL=small
ENV WHISPER_MODEL=${WHISPER_MODEL}
RUN python -c "import os; from faster_whisper import WhisperModel; WhisperModel(os.environ['WHISPER_MODEL'], device='cpu', compute_type='int8')"
COPY engine.py worker.py runner.py ./
ENV PYTHONUNBUFFERED=1
EXPOSE 8080
# Always-on Docker host: poll loop. Cloudflare Containers override with runner.py.
CMD ["python", "worker.py"]
