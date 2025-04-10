# backend/api/task.py
from fastapi import APIRouter, UploadFile, HTTPException
import redis
from pymongo import MongoClient
import uuid
import os

task_router = APIRouter()

# Redis client
redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

# Mongo client
mongo_client = MongoClient("mongodb://mongo:27017")
db = mongo_client["dataflowpulse"]
collection = db["task_results"]

@task_router.get("/task/{task_id}/status")
def get_task_status(task_id: str):
    status = redis_client.get(f"task:{task_id}:status")
    if status is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task_id": task_id, "status": status}

@task_router.get("/task/{task_id}/result")
def get_task_result(task_id: str):
    result = collection.find_one({"task_id": task_id}, {"_id": 0})  # exclude MongoDB _id field
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result