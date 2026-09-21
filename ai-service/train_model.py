import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

# 1. Sample Training Data (Complaints and their categories)
data = [
    ("Massive pothole on Main Street", "infrastructure"),
    ("Streetlight is broken and it's completely dark", "utility"),
    ("Garbage hasn't been collected in two weeks", "sanitation"),
    ("Water pipe burst and is flooding the road", "utility"),
    ("Deep crater in the middle of the highway", "infrastructure"),
    ("Trash overflowing in the public park", "sanitation")
]

texts = [item[0] for item in data]
labels = [item[1] for item in data]

# 2. Build and Train the Pipeline (TF-IDF + Classifier)
model = make_pipeline(TfidfVectorizer(), LogisticRegression())
model.fit(texts, labels)

# 3. Save the trained model to a file
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model trained and saved as model.pkl!")