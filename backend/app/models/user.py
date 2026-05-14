from sqlalchemy import Column, Integer, String, JSON
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    picture = Column(String)
    vibe = Column(String, default="casual")
    emotional_baseline = Column(String, default="steady")
    
    # Store sessions or other data in a JSON field for simplicity for now
    # or we can create a separate Session table later.
    settings = Column(JSON, default={})
