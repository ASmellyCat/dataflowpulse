import pandas as pd
import json
import redis
import time
from pymongo import MongoClient
from datetime import datetime
from pyspark.sql import SparkSession

# Redis client
redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

# MongoDB client
mongo_client = MongoClient("mongodb://mongo:27017")
db = mongo_client["dataflowpulse"]
collection = db["task_results"]

# Spark session
spark = SparkSession.builder.appName("DataFlowPulseProcessor").getOrCreate()

def process_task(task):
    task_id = task["task_id"]
    file_path = task["file_path"]
    task_type = task["task_type"]

    print(f"[Processor] Start processing task {task_id} (type: {task_type})")

    start_time = time.time()
    redis_client.set(f"task:{task_id}:status", "running")
    redis_client.set(f"task:{task_id}:start", start_time)
    redis_client.set(f"task:{task_id}:type", task_type)

    try:
        if task_type == "csv":
            result = process_csv(file_path)
        elif task_type == "log":
            result = process_log(file_path)
        elif task_type == "json":
            result = process_json(file_path)
        else:
            raise ValueError(f"Unsupported task type: {task_type}")

        try:
            collection.insert_one({"task_id": task_id, "result": result})
        except Exception as mongo_error:
            print(f"[Processor] MongoDB write failed: {mongo_error}")
            result = {"type": "error", "message": "MongoDB write failed", "raw_result": result}

        redis_client.set(f"task:{task_id}:status", "success")
        print(f"[Processor] Task {task_id} processed successfully.")

    except Exception as e:
        print(f"[Processor] Error processing task {task_id}: {e}")
        try:
            redis_client.set(f"task:{task_id}:status", "failed")
        except Exception as redis_error:
            print(f"[Processor] Redis fallback failed: {redis_error}")

    finally:
        end_time = time.time()
        try:
            redis_client.set(f"task:{task_id}:end", end_time)
        except Exception as redis_end_error:
            print(f"[Processor] Redis end_time write failed: {redis_end_error}")


# ====================
# Task Type Functions
# ====================

def process_csv(file_path):
    print(f"[Processor] Processing CSV via Spark: {file_path}")
    try:
        df = spark.read.csv(file_path, header=True, inferSchema=True)
        summary = df.describe().toPandas().to_dict(orient="records")
        return {"type": "csv", "summary": summary}
    except Exception as e:
        print(f"[Processor] Spark CSV fallback: {e}")
        df = pd.read_csv(file_path)
        return {"type": "csv", "data": df.to_dict(orient="records")}

def process_log(file_path):
    print(f"[Processor] Processing LOG via Spark: {file_path}")
    try:
        df = spark.read.text(file_path)
        import pyspark.sql.functions as F

        def parse_log_line(line):
            parts = F.split(line.value, ' ')
            return F.struct(
                parts[0].alias('ip'),
                parts[8].alias('status')
            )

        parsed_df = df.withColumn("parsed", parse_log_line(df))
        flat_df = parsed_df.select(
            parsed_df.parsed.ip.alias("ip"),
            parsed_df.parsed.status.alias("status")
        )
        status_counts = flat_df.groupBy("status").count().toPandas().to_dict(orient="records")
        ip_counts = flat_df.groupBy("ip").count().toPandas().to_dict(orient="records")
        return {"type": "log", "status_counts": status_counts, "ip_counts": ip_counts}
    except Exception as e:
        print(f"[Processor] Spark LOG fallback: {e}")
        status_counts = {}
        ip_counts = {}
        with open(file_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) < 9:
                    continue
                ip = parts[0]
                status = parts[8]
                ip_counts[ip] = ip_counts.get(ip, 0) + 1
                status_counts[status] = status_counts.get(status, 0) + 1
        return {"type": "log", "status_counts": status_counts, "ip_counts": ip_counts}

def process_json(file_path):
    print(f"[Processor] Processing JSON via Spark: {file_path}")
    try:
        with open(file_path, "r") as f:
            raw_data = json.load(f)
        df = spark.createDataFrame(raw_data)
        from pyspark.sql.functions import size
        summary_df = df.select("user_id", size("actions").alias("action_count"))
        sessions = summary_df.toPandas().to_dict(orient="records")
        return {"type": "json", "sessions": sessions}
    except Exception as e:
        print(f"[Processor] Spark JSON fallback: {e}")
        with open(file_path, "r") as f:
            data = json.load(f)
        sessions = []
        for entry in data:
            user_id = entry.get("user_id", "unknown")
            actions = entry.get("actions", [])
            sessions.append({"user_id": user_id, "action_count": len(actions), "actions": actions})
        return {"type": "json", "sessions": sessions}
