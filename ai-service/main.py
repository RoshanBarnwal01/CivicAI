import pickle
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Initialize FastAPI once with all proper settings
app = FastAPI(title="CivicPulse AI Microservice")

# Enable CORS for the React frontend (allow everything locally)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load our trained Scikit-learn model
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

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
    prediction = model.predict([complaint.text])[0]
    probabilities = model.predict_proba([complaint.text])[0]
    confidence = max(probabilities)
    return {"predicted_category": prediction, "confidence": round(confidence, 2)}

@app.post("/ai/predict-severity")
def predict_severity(complaint: ComplaintText):
    return {"predicted_severity": "high", "confidence": 0.78}

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