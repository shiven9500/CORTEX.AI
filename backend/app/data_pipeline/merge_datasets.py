import pandas as pd
from app.data_pipeline.load_data import load_goemotions, load_kaggle, load_dailydialog
from app.data_pipeline.preprocess import clean_text
from app.data_pipeline.label_mapping import map_emotion, map_goemotion

def process_all():

    go = load_goemotions()
    kg = load_kaggle()
    dd = load_dailydialog()
    go["text"] = go["text"].apply(clean_text)
    go["labels"] = go["labels"].astype(int)
    go["emotion"] = go["labels"].apply(map_goemotion)
    go["source"] = "goemotions"
    go = go.dropna()
    go = go[go["emotion"] != "neutral"]
    go = go[["text", "emotion", "source"]]
    kg["text"] = kg["text"].apply(clean_text)
    kg["emotion"] = kg["emotion"].apply(map_emotion)
    kg["source"] = "kaggle"

    kg = kg.dropna()
    kg = kg[["text", "emotion", "source"]]
    dd["text"] = dd["text"].apply(clean_text)
    dd["source"] = "dailydialog"

    dd = dd[["text", "emotion", "source"]]
    merged = pd.concat([go, kg, dd], ignore_index=True)
    merged.to_csv("data/processed/cleaned_text.csv", index=False)

    print("Data merged and saved!")
    print(merged.head())


if __name__ == "__main__":
    process_all()