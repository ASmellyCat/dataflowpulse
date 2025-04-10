from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.task import task_router

app = FastAPI()

# CORS for frontend (localhost:5173 in dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(task_router)

@app.get("/")
def root():
    return {"message": "Welcome to DataFlowPulse API"}
