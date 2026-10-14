# LeadFlow API image.
FROM python:3.12-slim

# tzdata: lets the seed script know "today" in the TZ given by docker compose.
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/*

# uv installs the pinned requirements (same tool as local development).
COPY --from=ghcr.io/astral-sh/uv:0.12.15 /uv /usr/local/bin/uv

WORKDIR /app
COPY requirements.txt .
# --system: the container is already isolated, so no venv is needed inside it.
RUN uv pip install --system --no-cache -r requirements.txt

COPY app ./app
COPY seed.py .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
