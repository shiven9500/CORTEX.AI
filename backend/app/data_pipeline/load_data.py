import pandas as pd
import os

BASE_PATH = "data/raw"

def load_goemotions():
    path = os.path.join(BASE_PATH, "goemotions", "train.tsv")
    df = pd.read_csv(path, sep="\t", header=None)
    df.columns = ["text", "labels", "id"]
    df = df[df["labels"].str.contains(",") == False]

    return df[["text", "labels"]]


def load_kaggle():
    path = os.path.join(BASE_PATH, "kaggle_emotions", "train.txt")
    df = pd.read_csv(path, sep=";", names=["text", "emotion"])

    return df


def load_dailydialog():
    path = os.path.join(BASE_PATH, "dailydialog", "train.csv")
    df = pd.read_csv(path)

    if "dialog" in df.columns:
        df = df.rename(columns={"dialog": "text"})
    elif "text" not in df.columns:
        df.columns = ["text"]

    df["emotion"] = None
    return df[["text", "emotion"]]