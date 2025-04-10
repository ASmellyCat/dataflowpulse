# worker/Dockerfile


FROM openjdk:11-slim

RUN apt-get update && apt-get install -y python3 python3-pip && \
    pip3 install --no-cache-dir kafka-python pandas pymongo redis pyspark

WORKDIR /app

COPY . /app

CMD ["python3", "-u", "consumer.py"]


