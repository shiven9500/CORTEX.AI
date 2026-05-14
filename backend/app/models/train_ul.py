import pandas as pd
import joblib
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

DATA_PATH = "data/processed/cleaned_text.csv"


def train_ul():

    df = pd.read_csv(DATA_PATH)
    texts = df["text"].dropna()

    vectorizer = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1, 2),
    stop_words="english",
    min_df=5
)

    X = vectorizer.fit_transform(texts)

    kmeans = KMeans(
        n_clusters=4,
        random_state=42,
        n_init=10
    )

    kmeans.fit(X)

    joblib.dump(kmeans, "models/kmeans.pkl")
    joblib.dump(vectorizer, "models/cluster_vectorizer.pkl")

    print("KMeans model saved!")

    labels = kmeans.labels_
    print("\n=== Cluster Distribution ===")
    unique, counts = np.unique(labels, return_counts=True)
    for u, c in zip(unique, counts):
        print(f"Cluster {u}: {c} samples")

    print("\n=== Top words per cluster ===")

    terms = vectorizer.get_feature_names_out()
    centroids = kmeans.cluster_centers_.argsort()[:, ::-1]

    for i in range(kmeans.n_clusters):
        top_words = [terms[ind] for ind in centroids[i, :10]]
        print(f"Cluster {i}: {', '.join(top_words)}")

    print("\n=== Sample cluster assignments ===")

    sample = texts.sample(10, random_state=42)
    sample_vec = vectorizer.transform(sample)
    preds = kmeans.predict(sample_vec)

    for t, c in zip(sample.tolist(), preds.tolist()):
        print(f"[Cluster {c}] {t}")


if __name__ == "__main__":
    train_ul()