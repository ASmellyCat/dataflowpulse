# backend/api/task.py
from fastapi import APIRouter, UploadFile, File, HTTPException
import redis
from pymongo import MongoClient
import uuid
import os
from datetime import datetime, timedelta

from kafka_producer import send_task_to_kafka

task_router = APIRouter()

# Redis client
redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

# MongoDB client
mongo_client = MongoClient("mongodb://mongo:27017")
collection = mongo_client["dataflowpulse"]["task_results"]

@task_router.post("/task/submit")
async def submit_task(file: UploadFile = File(...)):
    task_id = str(uuid.uuid4())
    filename = file.filename.lower()
    file_path = f"/tmp/{task_id}_{filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    if filename.endswith(".csv"):
        task_type = "csv"
    elif filename.endswith(".log"):
        task_type = "log"
    elif filename.endswith(".json"):
        task_type = "json"
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    send_task_to_kafka(task_id, file_path, task_type)

    # Set initial Redis status
    redis_client.set(f"task:{task_id}:status", "pending")
    redis_client.set(f"task:{task_id}:type", task_type)
    redis_client.set(f"task:{task_id}:start", datetime.utcnow().isoformat())

    return {"task_id": task_id, "status": "submitted"}


@task_router.get("/task/{task_id}/status")
def get_task_status(task_id: str):
    status = redis_client.get(f"task:{task_id}:status")
    if status is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task_id": task_id, "status": status}


@task_router.get("/task/{task_id}/result")
def get_task_result(task_id: str):
    result = collection.find_one({"task_id": task_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


@task_router.get("/metrics")
def get_metrics():
    keys = redis_client.keys("task:*:status")
    recent_tasks = []
    durations_by_type = {}
    success_count = 0
    total_count = 0
    now = datetime.utcnow()
    twenty_four_hours_ago = now - timedelta(hours=24)

    for key in keys:
        task_id = key.split(":")[1]
        status = redis_client.get(key)
        task_type = redis_client.get(f"task:{task_id}:type")
        start_time = redis_client.get(f"task:{task_id}:start")
        end_time = redis_client.get(f"task:{task_id}:end")

        recent_tasks.append({"task_id": task_id, "status": status})
        total_count += 1
        if status == "success":
            success_count += 1

        if task_type and start_time and end_time:
            try:
                start_dt = datetime.fromisoformat(start_time)
                end_dt = datetime.fromisoformat(end_time)
                if start_dt > twenty_four_hours_ago:
                    duration = (end_dt - start_dt).total_seconds()
                    durations_by_type.setdefault(task_type, []).append(duration)
            except Exception as e:
                print(f"[Metrics] Parse time error: {e}")

    avg_runtime = {
        k: round(sum(v) / len(v), 2) for k, v in durations_by_type.items() if v
    }

    success_rate = round((success_count / total_count) * 100, 2) if total_count else 0.0

    return {
        "recent_tasks": recent_tasks,
        "avg_runtime": avg_runtime,
        "success_rate": success_rate,
        "total_tasks": total_count,
        "success_tasks": success_count,
    }
