FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY engine.py worker.py ./
RUN useradd --create-home shorts
USER shorts
ENV PYTHONUNBUFFERED=1
CMD ["python", "worker.py"]
