# Mood Intelligence Engine - Comprehensive Project Documentation

## 🌟 Project Overview
The **Mood Intelligence Engine** is a state-of-the-art conversational AI designed to navigate human emotions with precision. Unlike standard chatbots that provide generic responses, this system analyzes the user's emotional state and historical context to select the most effective psychological response strategy.

### 🎯 Aim
To bridge the gap between human emotional complexity and machine response patterns by creating an agent that "learns" how to best support a user through different emotional phases.

### 💡 The Novelty (Why this is special)
The novelty lies in the **Hybrid Intelligence Architecture**. It doesn't just use one AI model; it combines four distinct AI branches:
1.  **Generative AI (Gemini)** for human-like understanding and text generation.
2.  **Supervised Learning (SL)** for rapid, cost-effective emotion classification.
3.  **Unsupervised Learning (UL)** for automatic topic/intent discovery without human labeling.
4.  **Reinforcement Learning (RL)** for strategic decision-making—making the AI "wise" over time by learning what works for each user.

---

## 🛠️ Detailed File-by-File Breakdown & Code Logic

### 1. API & Entry Layer
-   **[main.py](file:///c:/Users/Akash/OneDrive/Desktop/v1/backend/app/main.py)**: The gatekeeper. It hosts the FastAPI server, defines routes for chat and feedback, and ensures the frontend can securely communicate with the brain.

### 2. The Intelligence Core (Inference)
-   **[inference.py](file:///c:/Users/Akash/OneDrive/Desktop/v1/backend/app/models/inference.py)**: The Orchestrator. It coordinates the entire flow:
    -   Receives raw text.
    -   Calls Gemini/SL for **Emotion Detection**.
    -   Calls UL for **Thematic Clustering**.
    -   Feeds these into the **RL Agent** to get a strategy.
    -   Uses Gemini to generate the final response tailored to that strategy.

---

### 3. Supervised Learning (SL)
**File**: `app/models/train_sl.py`

**Explanation**: 
This module handles **Emotion Classification**. It uses a labeled dataset where sentences are mapped to emotions (e.g., "I feel great" -> "happy").
- **Algorithm**: Logistic Regression.
- **NLP Technique**: TF-IDF (Term Frequency-Inverse Document Frequency) to convert words into numbers.
- **Purpose**: Provides a local, high-speed fallback for emotion detection.

```python
# snippet from train_sl.py
vectorizer = TfidfVectorizer(max_features=7000, ngram_range=(1, 2))
model = LogisticRegression(max_iter=500, class_weight='balanced')
model.fit(X_train_vec, y_train)
```

---

### 4. Unsupervised Learning (UL)
**File**: `app/models/train_ul.py`

**Explanation**: 
This module handles **Thematic Clustering**. It groups user messages based on similarity *without* being told what the groups are.
- **Algorithm**: K-Means Clustering.
- **Concept**: If a user often talks about "work", "boss", and "deadline", the UL model puts these into one cluster (e.g., Cluster 2).
- **Purpose**: Helps the RL agent understand the *context* or *topic* of the conversation.

```python
# snippet from train_ul.py
kmeans = KMeans(n_clusters=4, random_state=42)
kmeans.fit(X) # X is the TF-IDF matrix of all conversation history
```

---

### 5. Reinforcement Learning (RL)
**File**: `app/models/rl_agent.py`

**Explanation**: 
This is the **Decision Maker**. It uses a Q-Learning algorithm to decide which "Action" (Strategy) to take.
- **State**: The combination of `Emotion` + `Cluster`.
- **Action**: One of `motivate`, `advice`, `distract`, `deep`.
- **Feedback Loop**: When you click a feedback button in the UI, it sends a "reward" to this agent. Positive rewards make that strategy more likely in the future.

```python
# snippet from rl_agent.py
def choose_action(self, state, epsilon=0.15):
    if random.random() < epsilon or state not in self.q_table:
        return random.choice(ACTIONS) # Exploration
    return max(self.q_table[state], key=self.q_table[state].get) # Exploitation
```

---

### 6. Natural Language Processing (NLP) Utilities
**File**: `app/data_pipeline/preprocess.py` & `app/models/response_generator.py`

**Explanation**:
- **Preprocessing**: Uses **Regex** to clean text. This is the first step of any NLP pipeline.
- **Response Generation**: A local engine that selects pre-written responses if the main AI is offline. It uses a `deque` memory to ensure the AI doesn't repeat itself.

```python
# Cleaning Logic
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-zA-Z\s]", "", text) # Removes numbers and punctuation
    return text.strip()

# Response Selection logic
class ResponseGenerator:
    def generate(self, emotion, action, text="", context=""):
        emotion_data = RESPONSES.get(emotion, RESPONSES["neutral"])
        action_data = emotion_data.get(action, emotion_data["motivate"])
        return random.choice(action_data)
```

---

### 7. Data Engineering
-   **[load_data.py](file:///c:/Users/Akash/OneDrive/Desktop/v1/backend/app/data_pipeline/load_data.py)**: Scripts to ingest massive datasets like GoEmotions.
-   **[merge_datasets.py](file:///c:/Users/Akash/OneDrive/Desktop/v1/backend/app/data_pipeline/merge_datasets.py)**: The "Kitchen" of the project where raw data is cleaned, mapped, and combined.
-   **[label_mapping.py](file:///c:/Users/Akash/OneDrive/Desktop/v1/backend/app/data_pipeline/label_mapping.py)**: Standardizes different dataset labels into 5 core emotions.

---

## 🎓 Summary for Viva

### What is the workflow?
1.  **User Input** is cleaned via **NLP Preprocessing**.
2.  **SL/LLM** identifies the **Emotion**.
3.  **UL (K-Means)** identifies the **Context/Cluster**.
4.  **RL Agent** looks at Emotion + Cluster and decides on a **Strategy**.
5.  **LLM (Gemini)** generates the final text based on that **Strategy**.
6.  **User Feedback** updates the **RL Q-Table** for future learning.

### Why not just use Gemini for everything?
Because then the AI wouldn't "learn" from you specifically. By using the **RL Agent** and **UL Clusters**, the AI builds a custom "profile" of what makes *you* feel better, making it a personalized emotional companion rather than just a generic chatbot.