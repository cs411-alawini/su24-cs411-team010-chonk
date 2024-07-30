FROM python:slim

WORKDIR /app
COPY requirements.lock ./
RUN PYTHONDONTWRITEBYTECODE=1 pip install --no-cache-dir -r requirements.lock

COPY src .
COPY model.pkl .
CMD ["fastapi", "run", "main.py", "--port", "80"]
