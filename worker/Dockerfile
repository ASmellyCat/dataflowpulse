# worker/Dockerfile

FROM python:3.12-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir kafka-python pandas pymongo redis

CMD ["python", "-u", "consumer.py"]

