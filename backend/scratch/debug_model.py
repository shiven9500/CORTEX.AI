import joblib
import re

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def test_model():
    try:
        model = joblib.load("models/sl_model.pkl")
        vectorizer = joblib.load("models/vectorizer.pkl")
        
        inputs = [
            "I am feeling a bit sad today",
            "Im feeling sad today",
            "I am sad",
            "I am happy"
        ]
        
        for text in inputs:
            cleaned = clean_text(text)
            vec = vectorizer.transform([cleaned])
            pred = model.predict(vec)[0]
            print(f"Input: '{text}' -> Cleaned: '{cleaned}' -> Pred: '{pred}'")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_model()