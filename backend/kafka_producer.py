# backend/kafka_producer.py
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers='kafka:9092', 
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def send_task_to_kafka(task_id, file_path):
    data = {"task_id": task_id, "file_path": file_path}
    producer.send("task_queue", data)
    print(f"[Producer] Sent task: {data}")

