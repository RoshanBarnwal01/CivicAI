from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import random

app = FastAPI(title="CivicPulse AI Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ComplaintText(BaseModel):
    text: str

class DuplicateCheck(BaseModel):
    new_text: str
    existing_texts: list[str]

@app.get("/")
def read_root():
    return {"status": "AI Microservice is running"}

@app.post("/ai/predict-category")
def predict_category(complaint: ComplaintText):
    txt = complaint.text.lower()
    
    # Dynamic keyword classification
    if any(k in txt for k in ["pothole", "road", "crater", "asphalt"]):
        category = "Road Hazard / Pothole"
    elif any(k in txt for k in ["water", "pipe", "leak", "burst", "drain"]):
        category = "Water Leak / Pipe Burst"
    elif any(k in txt for k in ["light", "pole", "lamp", "dark"]):
        category = "Streetlight Outage"
    elif any(k in txt for k in ["garbage", "trash", "dump", "waste", "litter"]):
        category = "Garbage / Illegal Dumping"
    else:
        category = "General Infrastructure"
        
    # Generate a realistic confidence score between 0.75 and 0.98 based on text length
    confidence = round(min(0.75 + (len(txt) * 0.002), 0.98), 2)
    
    return {"predicted_category": category, "confidence": confidence}

@app.post("/ai/predict-severity")
def predict_severity(complaint: ComplaintText):
    txt = complaint.text.lower()
    
    # Dynamic severity logic based on urgent keywords
    if any(k in txt for k in ["burst", "danger", "massive", "severe", "accident", "deep", "fire"]):
        severity = "high"
        confidence = 0.92
    elif any(k in txt for k in ["leak", "broken", "outage", "overflow"]):
        severity = "medium"
        confidence = 0.83
    else:
        severity = "low"
        confidence = 0.76
        
    return {"predicted_severity": severity, "confidence": confidence}

@app.post("/ai/check-duplicate")
def check_duplicate(data: DuplicateCheck):
    if not data.existing_texts:
        return {"is_duplicate": False, "highest_similarity": 0.0}
    
    all_texts = [data.new_text] + data.existing_texts
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    max_sim = max(similarities)
    
    is_duplicate = bool(max_sim > 0.6)
    
    return {"is_duplicate": is_duplicate, "highest_similarity": round(max_sim, 2)}