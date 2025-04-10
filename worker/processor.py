# worker/processor.py

import os
import pandas as pd
from pymongo import MongoClient
import redis

# Read config from environment
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
MONGO_HOST = os.environ.get("MONGO_HOST", "localhost")
MONGO_PORT = int(os.environ.get("MONGO_PORT", 27017))

# Initialize Redis and MongoDB clients
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
mongo_client = MongoClient(f"mongodb://{MONGO_HOST}:{MONGO_PORT}/")
db = mongo_client["dataflowpulse"]
results_collection = db["task_results"]

def update_status(task_id: str, status: str):
    redis_client.set(f"task:{task_id}:status", status)

def process_task(task):
    task_id = task["task_id"]
    file_path = task["file_path"]

    try:
        update_status(task_id, "running")
        print(f"[Processor] Processing task {task_id}...", flush=True)

        df = pd.read_csv(file_path)
        print(f"[Processor] Columns: {list(df.columns)}", flush=True)
        print(f"[Processor] Head:\n{df.head()}", flush=True)

        result = {
            "task_id": task_id,
            "columns": list(df.columns),
            "preview": df.head().to_dict(orient="records"),
        }

        results_collection.insert_one(result)
        update_status(task_id, "success")

    except Exception as e:
        update_status(task_id, "failed")
        print(f"[Processor] Error: {e}", flush=True)
