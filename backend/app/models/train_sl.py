import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

DATA_PATH = "data/processed/cleaned_text.csv"


def train():
    df = pd.read_csv(DATA_PATH)

    df = df.dropna(subset=["emotion"])

    X = df["text"]
    y = df["emotion"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    vectorizer = TfidfVectorizer(
        max_features=7000,
        ngram_range=(1, 2)
    )

    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    
    model = LogisticRegression(max_iter=500, class_weight='balanced')
    model.fit(X_train_vec, y_train)

    y_pred = model.predict(X_test_vec)

    print("\n=== Classification Report ===\n")
    print(classification_report(y_test, y_pred))

    joblib.dump(model, "models/sl_model.pkl")
    joblib.dump(vectorizer, "models/vectorizer.pkl")

    print("\nModel and vectorizer saved!")


if __name__ == "__main__":
    train()