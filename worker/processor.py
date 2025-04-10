import pandas as pd
import json
import redis
from pymongo import MongoClient

# Redis client
redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

# Mongo client
mongo_client = MongoClient("mongodb://mongo:27017")
db = mongo_client["dataflowpulse"]
collection = db["task_results"]


def process_task(task):
    task_id = task["task_id"]
    file_path = task["file_path"]
    task_type = task["task_type"]

    # Set state as running
    redis_client.set(f"task:{task_id}:status", "running")

    try:
        if task_type == "csv":
            result = process_csv(file_path)
        elif task_type == "log":
            result = process_log(file_path)
        elif task_type == "json":
            result = process_json(file_path)
        else:
            raise ValueError(f"Unsupported task type: {task_type}")

        # save to MongoDB
        collection.insert_one({"task_id": task_id, "result": result})

        # Update Redis states
        redis_client.set(f"task:{task_id}:status", "success")
    except Exception as e:
        print(f"[Processor] Error: {e}")
        redis_client.set(f"task:{task_id}:status", "failed")


def process_csv(file_path):
    print(f"[Processor] Processing CSV: {file_path}")
    df = pd.read_csv(file_path)

    result = {
        "row_count": len(df),
        "columns": list(df.columns),
        "null_rate": df.isnull().mean().to_dict(),
        "average_numeric": df.select_dtypes(include='number').mean().to_dict()
    }

    return result


def process_log(file_path):
    print(f"[Processor] Processing LOG: {file_path}")
    status_counts = {}
    ip_counts = {}

    with open(file_path, "r") as f:
        for line in f:
            parts = line.split()
            if len(parts) < 9:
                continue
            ip = parts[0]
            status = parts[8]

            ip_counts[ip] = ip_counts.get(ip, 0) + 1
            status_counts[status] = status_counts.get(status, 0) + 1

    return {
        "ip_counts": ip_counts,
        "status_counts": status_counts
    }


def process_json(file_path):
    print(f"[Processor] Processing JSON: {file_path}")
    with open(file_path, "r") as f:
        data = json.load(f)

    user_sessions = {}
    for entry in data:
        user_id = entry.get("user_id")
        session = entry.get("session")

        if user_id not in user_sessions:
            user_sessions[user_id] = {"session_count": 0, "actions": []}

        user_sessions[user_id]["session_count"] += 1
        user_sessions[user_id]["actions"].extend(entry.get("actions", []))

    return user_sessions
