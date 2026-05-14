import random
import json
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Q_TABLE_PATH = "models/q_table.json"
PERSONALITY_PATH = "models/neural_personality.json"
ACTIONS = ["motivate", "advice", "distract", "deep"]

class RLAgent:
    def __init__(self, q_path=Q_TABLE_PATH, p_path=PERSONALITY_PATH):
        self.q_path = q_path
        self.p_path = p_path
        self.q_table = self._load_json(self.q_path, {})
        self.personality = self._load_json(self.p_path, {
            "empathy": 0.5,      # 0.0 (Cold) to 1.0 (Deeply Empathetic)
            "conciseness": 0.5,  # 0.0 (Verbose) to 1.0 (Direct)
            "complexity": 0.5    # 0.0 (Simple) to 1.0 (Philosophical)
        })

    def _load_json(self, path, default):
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading {path}: {e}")
        return default

    def save(self):
        try:
            with open(self.q_path, "w") as f:
                json.dump(self.q_table, f, indent=4)
            with open(self.p_path, "w") as f:
                json.dump(self.personality, f, indent=4)
        except Exception as e:
            logger.error(f"Error saving RL data: {e}")

    def get_state(self, emotion, cluster):
        return f"{emotion}_{cluster}"

    def choose_action(self, state, epsilon=0.15):
        if random.random() < epsilon or state not in self.q_table:
            return random.choice(ACTIONS)
        
        state_actions = self.q_table[state]
        return max(state_actions, key=state_actions.get)

    def update(self, state, action, reward, alpha=0.1, gamma=0.9):
        # Update Q-Table (Strategy)
        if state not in self.q_table:
            self.q_table[state] = {a: 0.0 for a in ACTIONS}

        current_q = self.q_table[state][action]
        max_q = max(self.q_table[state].values())
        
        new_q = current_q + alpha * (reward + gamma * max_q - current_q)
        self.q_table[state][action] = new_q
        
        # Update Personality Dials (Tone)
        # If reward is positive, nudge dials based on the action taken
        nudge = 0.05 if reward > 0 else -0.05
        if action == "deep":
            self.personality["empathy"] = max(0, min(1, self.personality["empathy"] + nudge))
            self.personality["complexity"] = max(0, min(1, self.personality["complexity"] + nudge))
        elif action == "advice":
            self.personality["conciseness"] = max(0, min(1, self.personality["conciseness"] + nudge))
        
        self.save()

    def get_personality_context(self):
        e = "Empathetic" if self.personality["empathy"] > 0.5 else "Analytical"
        c = "Direct" if self.personality["conciseness"] > 0.5 else "Detailed"
        x = "Philosophical" if self.personality["complexity"] > 0.5 else "Practical"
        return f"Personality Mode: {e}, {c}, and {x}."

agent = RLAgent()