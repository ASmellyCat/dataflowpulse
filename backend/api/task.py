from fastapi import APIRouter, UploadFile, File, HTTPException
import redis
from pymongo import MongoClient
import uuid
import os
import time  # ✅ 添加
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

    # Redis fallback
    try:
        redis_client.set(f"task:{task_id}:status", "pending")
        redis_client.set(f"task:{task_id}:type", task_type)
        redis_client.set(f"task:{task_id}:start", time.time())  # ✅ 改为秒值
    except Exception as e:
        print(f"[FastAPI] Redis fallback: Failed to write task {task_id} metadata: {e}")

    return {"task_id": task_id, "status": "submitted"}


@task_router.get("/task/{task_id}/status")
def get_task_status(task_id: str):
    try:
        status = redis_client.get(f"task:{task_id}:status")
    except Exception as e:
        print(f"[FastAPI] Redis fallback: Failed to get task status: {e}")
        raise HTTPException(status_code=503, detail="Redis unavailable")
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
    try:
        keys = redis_client.keys("task:*:status")
    except Exception as e:
        print(f"[FastAPI] Redis fallback: Failed to query metrics: {e}")
        return {
            "recent_tasks": [],
            "avg_runtime": {},
            "success_rate": 0.0,
            "total_tasks": 0,
            "success_tasks": 0,
            "hourly_task_counts": []
        }

    recent_tasks = []
    durations_by_type = {}
    hourly_buckets = {}  
    success_count = 0
    total_count = 0
    now = datetime.utcnow()
    twenty_four_hours_ago = now - timedelta(hours=24)

    for i in range(24):
        hour = (now - timedelta(hours=23 - i)).replace(minute=0, second=0, microsecond=0)
        hourly_buckets[hour] = 0

    for key in keys:
        task_id = key.split(":")[1]
        try:
            status = redis_client.get(key)
            task_type = redis_client.get(f"task:{task_id}:type")
            start_time = redis_client.get(f"task:{task_id}:start")
            end_time = redis_client.get(f"task:{task_id}:end")
        except Exception as e:
            print(f"[FastAPI] Redis fallback during metrics read: {e}")
            continue

        recent_tasks.append({"task_id": task_id, "status": status, "type": task_type})
        total_count += 1
        if status == "success":
            success_count += 1

        if task_type and start_time and end_time:
            try:
                start_ts = float(start_time)
                end_ts = float(end_time)
                duration = end_ts - start_ts
                if duration > 0:
                    start_dt = datetime.utcfromtimestamp(start_ts)
                    end_dt = datetime.utcfromtimestamp(end_ts)

                    if start_dt > twenty_four_hours_ago:
                        durations_by_type.setdefault(task_type, []).append(duration)

                    if twenty_four_hours_ago <= end_dt <= now:
                        hour_slot = end_dt.replace(minute=0, second=0, microsecond=0)
                        if hour_slot in hourly_buckets:
                            hourly_buckets[hour_slot] += 1

            except Exception as e:
                print(f"[Metrics] Time parse or duration error for task {task_id}: {e}")

    hourly_task_counts = [
        {"hour": hour.strftime("%Y-%m-%d %H:%M"), "count": count}
        for hour, count in sorted(hourly_buckets.items())
    ]

    avg_runtime = {
        k: round(sum(v) / len(v), 6) for k, v in durations_by_type.items() if v
    }

    success_rate = round((success_count / total_count) * 100, 2) if total_count else 0.0

    return {
        "recent_tasks": recent_tasks,
        "avg_runtime": avg_runtime,
        "success_rate": success_rate,
        "total_tasks": total_count,
        "success_tasks": success_count,
        "hourly_task_counts": hourly_task_counts 
    }
