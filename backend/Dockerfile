FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install uv && uv pip install -r pyproject.toml --system
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
