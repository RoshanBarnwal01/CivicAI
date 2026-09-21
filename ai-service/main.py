import pickle
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="CivicPulse AI Microservice")

# Load our newly trained Scikit-learn model
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
    # TODO: Replace with keyword/ML hybrid model
    return {"predicted_severity": "high", "confidence": 0.78}

@app.post("/ai/check-duplicate")
def check_duplicate(data: DuplicateCheck):
    if not data.existing_texts:
        return {"is_duplicate": False, "highest_similarity": 0.0}
    
    # Combine texts to convert them into numbers using TF-IDF
    all_texts = [data.new_text] + data.existing_texts
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # Calculate how similar the new text (index 0) is to the existing texts
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    max_sim = max(similarities)
    
    # If the similarity score is above 0.6 (60%), we flag it as a duplicate
    is_duplicate = bool(max_sim > 0.6)
    
    return {"is_duplicate": is_duplicate, "highest_similarity": round(max_sim, 2)}