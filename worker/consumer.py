# worker/consumer.py

print("🚀 CONSUMER STARTED 🚀", flush=True)

from kafka import KafkaConsumer
import json
from processor import process_task
import time

try:
    consumer = KafkaConsumer(
        'task_queue',
        bootstrap_servers='kafka:9092',
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        auto_offset_reset='earliest',
        group_id='dataflowpulse-workers'
    )

    print("[Consumer] Waiting for messages...", flush=True)

    for msg in consumer:
        task = msg.value
        print(f"[Consumer] Received task: {task}")
        task_id = task['task_id']
        file_path = task['file_path']
        process_task(task)

except Exception as e:
    print(f"[Consumer] ERROR: {e}")
