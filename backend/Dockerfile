# backend/Dockerfile

FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# Copy all backend files into the container
COPY . /app

# Upgrade pip and install dependencies listed in requirements.txt
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Startup command: launch the FastAPI app using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

