# backend/kafka_producer.py
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers="kafka:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

def send_task_to_kafka(task_id: str, file_path: str, task_type: str):
    data = {
        "task_id": task_id,
        "file_path": file_path,
        "task_type": task_type,
    }
    print(f"[Producer] Sent task: {data}")
    producer.send("task_queue", data)
