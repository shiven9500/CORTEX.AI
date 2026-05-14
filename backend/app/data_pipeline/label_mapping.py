EMOTION_MAP = {
    "joy": "happy",
    "love": "happy",

    "sadness": "sad",

    "anger": "angry",

    "fear": "anxious",
    "surprise": "anxious"
}


def map_emotion(label):
    return EMOTION_MAP.get(label, None)

GOEMOTION_MAP = {
    0: "happy",
    1: "happy",
    2: "angry",
    3: "angry",
    4: "anxious",
    5: "anxious",
    6: "anxious",
    7: "happy",
    8: "happy",
    9: "happy",
    10: "happy",
    11: "happy",
    12: "sad",
    13: "sad",
    14: "angry",
    15: "angry",
    16: "sad",
    17: "happy",
    18: "happy",
    19: "happy",
    20: "happy",
    21: "sad",
    22: "sad",
    23: "angry",
    24: "happy",
    25: "happy",
    26: "happy",
    27: "neutral"
}


def map_goemotion(label):
    return GOEMOTION_MAP.get(label, None)