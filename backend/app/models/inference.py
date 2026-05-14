import joblib
import logging
import os
from typing import Dict, Any
from dotenv import load_dotenv
from groq import Groq

from app.data_pipeline.preprocess import clean_text
from app.models.rl_agent import agent
from app.models.memory import add_to_memory, get_memory

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL_NAME = "llama-3.3-70b-versatile"  # 128K context, much smarter than 8b

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    sl_model = joblib.load("models/sl_model.pkl")
    vectorizer = joblib.load("models/vectorizer.pkl")
    kmeans = joblib.load("models/kmeans.pkl")
    cluster_vectorizer = joblib.load("models/cluster_vectorizer.pkl")
except Exception as e:
    logger.error(f"Failed to load models: {e}")
    sl_model = vectorizer = kmeans = cluster_vectorizer = None

# Track message count for periodic insight extraction
_message_counter = {"count": 0}

def fallback_response(user_input: str, session_id: str = "default") -> Dict[str, Any]:
    return {
        "input": user_input,
        "emotion": "neutral",
        "cluster": 0,
        "action": "support",
        "response": "I'm here with you. Want to tell me more?",
        "state": "neutral_0",
        "session_id": session_id,
        "analysis": {
            "confidence": 0.0,
            "pipeline": "fallback"
        }
    }

def _build_conversation_messages(history, user_knowledge, emotion, action):
    """Build a proper system + message list for Groq chat completions."""
    
    # Truncate knowledge to last 10 insights to keep prompt small
    knowledge_text = user_knowledge if user_knowledge != "No persistent knowledge yet." else "None yet — this is a new user."
    
    system_msg = f"""You are CORTEX, an emotionally intelligent AI companion. You listen carefully and respond to the SPECIFIC content of what the user says.

CRITICAL FORMAT RULE:
You MUST start your reply with an emotion tag on its own line: [EMOTION: X]
where X is exactly ONE of: happy, sad, angry, anxious, neutral
This tag must reflect the USER's emotion based on what they said. After the tag, write your response normally.

Example:
[EMOTION: happy]
That's awesome to hear! What made your day so good?

CORE RULES:
- Respond directly to what the user SAID — reference their specific words, events, names, numbers.
- If they feel mixed emotions, pick the DOMINANT one for the tag, but acknowledge both in your response.
- For heavy topics (death, breakup, failure), respond with genuine weight. Don't rush to fix things.
- Ask thoughtful follow-up questions that prove you understood their situation.
- Keep responses 2-4 sentences. Sound like a caring friend, not a robot.
- NEVER give generic motivational quotes or therapy-speak.

{agent.get_personality_context()}

What you remember about this user:
{knowledge_text}

Approach suggestion: {action}"""

    messages = [{"role": "system", "content": system_msg}]
    
    # Add conversation history as proper alternating messages (last 6)
    recent = history[-6:]
    for msg in recent:
        role = "user" if msg["role"] == "user" else "assistant"
        # Truncate individual messages to 300 chars to save tokens
        text = msg["text"][:300]
        messages.append({"role": role, "content": text})
    
    return messages

def predict(user_input: str, session_id: str = "default", force_local: bool = False) -> Dict[str, Any]:
    if not user_input or len(user_input.strip()) < 2:
        return fallback_response(user_input, session_id)

    try:
        text = clean_text(user_input)
        if not text:
            return fallback_response(user_input, session_id)
        
        add_to_memory(session_id, "user", user_input)
        _message_counter["count"] += 1

        emotion = "neutral"
        engine_used = "Neural Lite"
        
        # --- Emotion Detection (local first, fast and free) ---
        if sl_model and vectorizer:
            vec = vectorizer.transform([text])
            emotion = sl_model.predict(vec)[0]
        
        cluster = 0
        if kmeans and cluster_vectorizer:
            c_vec = cluster_vectorizer.transform([text])
            cluster = int(kmeans.predict(c_vec)[0])

        state = agent.get_state(emotion, cluster)
        action = agent.choose_action(state)

        # Build conversation context
        history = get_memory(session_id)
        
        # Pull long-term knowledge
        from app.models.memory import get_knowledge_context, add_user_insight
        user_knowledge = get_knowledge_context()
        
        response = None
        if not force_local:
            try:
                # Build proper chat messages (system + history)
                messages = _build_conversation_messages(history, user_knowledge, emotion, action)
                
                response_gen = client.chat.completions.create(
                    messages=messages,
                    model=MODEL_NAME,
                    temperature=0.7,
                    max_tokens=350
                )
                raw_response = response_gen.choices[0].message.content.strip()
                engine_used = f"Cortex Pro ({MODEL_NAME})"
                
                # Parse emotion tag from response
                import re
                emotion_match = re.search(r'\[EMOTION:\s*(\w+)\]', raw_response)
                if emotion_match:
                    detected = emotion_match.group(1).strip().lower()
                    if detected in ["happy", "sad", "angry", "anxious", "neutral"]:
                        emotion = detected
                    # Remove the tag from the visible response
                    response = re.sub(r'\[EMOTION:\s*\w+\]\s*', '', raw_response).strip()
                else:
                    response = raw_response
                
                # Update state with the corrected emotion
                state = agent.get_state(emotion, cluster)
                
                # Extract insights every 5 messages (not every message)
                if _message_counter["count"] % 5 == 0:
                    try:
                        # Collect last few user messages for batch insight extraction
                        recent_user_msgs = [m["text"] for m in history[-5:] if m["role"] == "user"]
                        combined_text = " | ".join(recent_user_msgs)
                        
                        insight_prompt = f"""From these user messages, extract any specific facts about their life. Only extract CLEAR facts, not vague feelings.

Messages: "{combined_text}"

Return each fact on a new line as TOPIC: VALUE
Examples: "academics: passed exam with 98%", "hobby: painting", "family: has a younger sister"
If nothing specific, return: NONE"""
                        
                        insight_gen = client.chat.completions.create(
                            messages=[{"role": "user", "content": insight_prompt}],
                            model=MODEL_NAME,
                            temperature=0.1,
                            max_tokens=150
                        )
                        insight_text = insight_gen.choices[0].message.content.strip()
                        if "NONE" not in insight_text.upper() and ":" in insight_text:
                            for line in insight_text.split("\n"):
                                line = line.strip().lstrip("- ").lstrip("* ")
                                if ":" in line and not line.startswith("Example"):
                                    topic, value = line.split(":", 1)
                                    topic = topic.strip().strip('"').strip("'")
                                    value = value.strip().strip('"').strip("'")
                                    if topic and value and 2 < len(topic) < 40 and len(value) < 100:
                                        add_user_insight(topic, value)
                    except Exception as e:
                        logger.error(f"Insight Extraction Error: {e}")

            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "rate_limit" in err_str.lower() or "rate limit" in err_str.lower():
                    logger.warning("Groq Rate Limit hit. Falling back to local generator.")
                    engine_used = "Neural Lite (Rate Limited)"
                else:
                    logger.error(f"Groq Response Error: {e}")
                    engine_used = "Neural Lite (Error Fallback)"
        else:
            engine_used = "Neural Lite (Manual)"

        if not response:
            from app.models.response_generator import generate_response
            # Build a short context string for the local generator
            recent_msgs = [m["text"][:80] for m in history[-4:]]
            local_context = " | ".join(recent_msgs)
            response = generate_response(emotion=emotion, action=action, text=user_input, context=local_context, knowledge=user_knowledge)
        
        add_to_memory(session_id, "ai", response)

        return {
            "input": user_input,
            "emotion": emotion,
            "cluster": cluster,
            "action": action,
            "response": response,
            "state": state,
            "session_id": session_id,
            "analysis": {
                "detected_emotion": emotion,
                "user_intent": "normal",
                "cluster_group": cluster,
                "strategy": action,
                "engine": engine_used,
                "quota_hit": "Rate Limited" in engine_used
            }
        }

    except Exception as e:
        logger.error(f"Prediction Error: {e}", exc_info=True)
        return fallback_response(user_input, session_id)

def feedback(state: str, action: str, reward: int):
    try:
        if state and action:
            agent.update(state, action, reward)
    except Exception as e:
        logger.error(f"Feedback Error: {e}")