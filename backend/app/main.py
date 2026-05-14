from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.models.inference import predict, feedback
from app.utils.rate_limiter import limiter
from app.database import engine, Base, get_db
from app.auth import router as auth_router
import os
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("mood-ai")

app = FastAPI(title="Mood AI Engine")

# Create database tables
Base.metadata.create_all(bind=engine)

@app.on_event("startup")
async def startup_event():
    logger.info("Mood AI Engine starting up...")

# Add Session Middleware
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "super-secret-key"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview/prod URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.1"}

class ChatRequest(BaseModel):
    message: str
    model: str = "cortex-pro"
    session_id: str = "default"


class FeedbackRequest(BaseModel):
    state: str
    action: str
    reward: int

@app.get("/")
def home():
    return {"message": "Mood AI Backend Running!"}


@app.post("/chat")
def chat(req: ChatRequest):
    force_local = (req.model == "neural-lite")
    result = predict(req.message, session_id=req.session_id, force_local=force_local)
    result["remaining"] = 9999
    return result

@app.get("/usage")
def usage():
    return {"remaining": 9999, "limit": 9999}

@app.get("/knowledge")
def get_knowledge():
    from app.models.memory import memory_manager
    return memory_manager.knowledge

@app.get("/personality")
def get_personality():
    from app.models.rl_agent import agent
    return agent.personality

@app.post("/feedback")
def give_feedback(req: FeedbackRequest):
    feedback(req.state, req.action, req.reward)
    return {"status": "updated"}