print("\U0001F680 CONSUMER STARTED \U0001F680", flush=True)

from kafka import KafkaConsumer
import json
import redis
import time
from kafka.errors import KafkaError
from processor import process_task

# Redis client
redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

MAX_RETRIES = 3


def start_consumer():
    try:
        consumer = KafkaConsumer(
            'task_queue',
            bootstrap_servers='kafka:9092',
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='earliest',
            group_id='dataflowpulse-workers',
            enable_auto_commit=True,
            consumer_timeout_ms=10000  
        )

        print("[Consumer] Waiting for messages...", flush=True)

        for msg in consumer:
            try:
                task = msg.value
                task_id = task.get("task_id", "unknown")
                print(f"[Consumer] Received task {task_id}", flush=True)

                try:
                    process_task(task)

                except Exception as e:
                    retry_key = f"task:{task_id}:retries"
                    try:
                        retry_count = int(redis_client.get(retry_key) or 0)
                        if retry_count < MAX_RETRIES:
                            redis_client.set(retry_key, retry_count + 1)
                            print(f"[Consumer] Retry {retry_count + 1} for task {task_id} due to error: {e}", flush=True)
                        else:
                            print(f"[Consumer] Task {task_id} failed after {MAX_RETRIES} retries. Skipping.", flush=True)
                    except Exception as redis_retry_error:
                        print(f"[Consumer] Redis retry logic failed for task {task_id}: {redis_retry_error}", flush=True)
                        print(f"[Consumer] Task {task_id} skipped due to retry fallback.", flush=True)

            except Exception as parse_error:
                print(f"[Consumer] Failed to parse Kafka message: {parse_error}", flush=True)

    except KafkaError as e:
        print(f"[Consumer] Kafka error: {e}", flush=True)



while True:
    start_consumer()
    print("[Consumer] Reconnecting in 5 seconds...", flush=True)
    time.sleep(5)