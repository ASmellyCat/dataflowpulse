from fastapi import FastAPI, UploadFile, File
from kafka_producer import send_task_to_kafka
from api.task import task_router  # ✅ 导入你写的接口
import shutil
import uuid
import os

app = FastAPI()

app.include_router(task_router)

@app.get("/")
def root():
    return {"message": "Hello from FastAPI"}

@app.post("/task/submit")
async def submit_task(file: UploadFile = File(...)):
    task_id = str(uuid.uuid4())
    file_path = f"/tmp/{task_id}_{file.filename}"

    os.makedirs("/tmp", exist_ok=True)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    send_task_to_kafka(task_id, file_path)
    return {"task_id": task_id, "status": "submitted"}
