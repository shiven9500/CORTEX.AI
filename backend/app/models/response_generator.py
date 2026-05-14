import random
import re
from collections import deque
import logging

logger = logging.getLogger(__name__)

class ResponseMemory:
    def __init__(self, size=8):
        self.memory = deque(maxlen=size)

    def is_repeating(self, resp):
        return resp in self.memory

    def remember(self, resp):
        self.memory.append(resp)

memory = ResponseMemory()

# --- Keyword extraction helpers ---
def extract_key_phrases(text):
    """Pull specific nouns, events, and details from user input."""
    text_lower = text.lower()
    phrases = []
    
    # Look for numbers (scores, percentages, ages, etc.)
    numbers = re.findall(r'\d+%?', text)
    if numbers:
        phrases.extend(numbers)
    
    # Look for named events/things
    event_patterns = [
        r'(?:my|the|a)\s+([\w\s]+?)(?:\s+(?:is|was|are|were|has|had|got|died|left|passed))',
        r'(?:passed|failed|lost|won|got|started|finished|broke|left)\s+([\w\s]+?)(?:\.|,|!|\?|$)',
        r'(?:about|because|since|after|before)\s+([\w\s]+?)(?:\.|,|!|\?|$)',
    ]
    for pattern in event_patterns:
        matches = re.findall(pattern, text_lower)
        phrases.extend([m.strip() for m in matches if len(m.strip()) > 2])
    
    return phrases[:3]  # Top 3 key phrases

def detect_situation(text):
    """Detect the specific type of situation the user is describing."""
    text_lower = text.lower()
    
    if any(w in text_lower for w in ["died", "death", "passed away", "funeral", "lost someone"]):
        return "grief"
    if any(w in text_lower for w in ["exam", "test", "grade", "marks", "score", "passed", "failed", "result"]):
        return "academic"
    if any(w in text_lower for w in ["breakup", "broke up", "divorce", "left me", "dumped"]):
        return "relationship_loss"
    if any(w in text_lower for w in ["job", "interview", "promotion", "fired", "hired", "work"]):
        return "career"
    if any(w in text_lower for w in ["friend", "friendship", "betrayed", "fight with"]):
        return "friendship"
    if any(w in text_lower for w in ["health", "sick", "hospital", "doctor", "pain", "surgery"]):
        return "health"
    if any(w in text_lower for w in ["lonely", "alone", "nobody", "no one", "isolated"]):
        return "loneliness"
    if any(w in text_lower for w in ["family", "parents", "mom", "dad", "mother", "father", "sibling", "brother", "sister"]):
        return "family"
    return "general"

def detect_mixed_emotion(text):
    """Check if the user expresses mixed feelings."""
    text_lower = text.lower()
    positive = any(w in text_lower for w in ["happy", "great", "good", "excited", "proud", "glad", "love"])
    negative = any(w in text_lower for w in ["sad", "but", "however", "though", "upset", "didn't", "not", "wish", "regret", "worried"])
    return positive and negative

def detect_intent(text):
    text = text.lower()
    if any(w in text for w in ["hi", "hello", "hey", "greetings"]):
        return "greeting"
    if "?" in text or any(w in text for w in ["why", "how", "what should", "help me", "what do i", "can you"]):
        return "question"
    if len(text.split()) <= 2:
        return "short"
    return "normal"

# Situation-aware response templates
SITUATION_RESPONSES = {
    "grief": {
        "openers": [
            "I'm so sorry about your loss.",
            "That's devastating, and I'm not going to pretend otherwise.",
            "Losing someone... there's no easy way through that."
        ],
        "follow_ups": [
            "Do you want to tell me about them?",
            "How long has it been?",
            "Are you taking care of yourself right now?",
            "Is there someone around you who can be there with you?"
        ]
    },
    "academic": {
        "openers": [
            "That's a real achievement, and the effort behind it matters.",
            "Exams can carry so much weight emotionally.",
            "Results like that don't come without serious dedication."
        ],
        "follow_ups": [
            "What was the hardest part of preparing for it?",
            "How are you feeling about what comes next?",
            "Is there pressure to hit a certain number, or is this about your own standards?",
            "Who's the first person you told about this?"
        ]
    },
    "relationship_loss": {
        "openers": [
            "That takes a real toll, and it's okay to feel the full weight of it.",
            "Breakups can feel like the ground shifted under you.",
            "You don't have to have it all figured out right now."
        ],
        "follow_ups": [
            "How long were you two together?",
            "What's been the hardest part since it happened?",
            "Are you eating and sleeping okay?"
        ]
    },
    "career": {
        "openers": [
            "Work stuff can really shake up your sense of stability.",
            "That's a significant shift in your day-to-day.",
            "Career moments—whether good or bad—tend to ripple into everything else."
        ],
        "follow_ups": [
            "How is this affecting your routine?",
            "What's your gut telling you about the next step?",
            "Is there someone at work you trust to talk to about this?"
        ]
    },
    "loneliness": {
        "openers": [
            "Feeling alone—especially when you're surrounded by people—is one of the hardest things.",
            "Loneliness isn't about being alone. It's about feeling unseen.",
            "That takes courage to say out loud."
        ],
        "follow_ups": [
            "When did this feeling start becoming constant?",
            "Is there one person you wish you could connect with right now?",
            "What does a 'good day' look like for you lately?"
        ]
    },
    "family": {
        "openers": [
            "Family dynamics can be the most complex thing to navigate.",
            "The people closest to us can sometimes cause the deepest feelings.",
            "Family stuff runs deep—it makes sense that it's affecting you."
        ],
        "follow_ups": [
            "Is this a recent thing or has it been building up?",
            "What would help the most right now—space, or a conversation?",
            "Do you feel heard by them?"
        ]
    },
    "health": {
        "openers": [
            "Dealing with health stuff adds a layer of stress to everything.",
            "Your body going through something affects your mind too—they're deeply connected.",
            "That sounds really tough to deal with."
        ],
        "follow_ups": [
            "Are you getting the support you need right now?",
            "What's been the most draining part of this?",
            "How are you managing day to day?"
        ]
    },
    "friendship": {
        "openers": [
            "Friendships carry so much of our emotional weight—when they shift, it hurts.",
            "That's a real sting, especially from someone you trusted.",
            "Friend stuff is underrated in how much it can affect you."
        ],
        "follow_ups": [
            "Was this out of nowhere, or have things been building?",
            "Do you think there's a path to fixing it, or does it feel done?",
            "Who else do you have in your corner right now?"
        ]
    },
    "general": {
        "openers": [
            "I hear you.",
            "That's a lot to carry.",
            "Thanks for sharing that with me."
        ],
        "follow_ups": [
            "What part of this feels the most pressing right now?",
            "Is there something specific you'd like to talk through?",
            "How has this been sitting with you?"
        ]
    }
}

MIXED_EMOTION_BRIDGES = [
    "I can tell there are two sides to this for you.",
    "It makes total sense to feel both things at once.",
    "That mix of feelings—both are completely valid.",
    "Holding two emotions at the same time is hard, but it shows real self-awareness."
]

class ResponseGenerator:
    def __init__(self):
        self.short_pool = [
            "I'm here—take your time.",
            "What's going on?",
            "I'm listening.",
            "Tell me more when you're ready.",
            "What's on your mind?"
        ]
        self.escalations = [
            "It's okay to not know exactly how you feel. What's the closest word?",
            "Even a single detail can help—what happened?",
            "Is it more about something that happened, or more about how you're feeling in general?",
            "We don't have to solve anything. Just talk."
        ]

    def is_stuck(self, context):
        if not context: return False
        context = context.lower()
        triggers = ["i dont know", "idk", "not sure", "i'm not sure"]
        count = sum(context.count(t) for t in triggers)
        return count >= 2

    def generate(self, emotion, action, text="", context="", knowledge=None):
        intent = detect_intent(text)

        if self.is_stuck(context):
            return random.choice(self.escalations)

        if intent == "greeting":
            greetings = [
                "Hey! How's everything going?",
                "Hi there! What's happening in your world today?",
                "Hey—glad you're here. What's on your mind?"
            ]
            return random.choice(greetings)
        
        if intent == "short":
            resp = random.choice(self.short_pool)
            return resp if not memory.is_repeating(resp) else random.choice(self.escalations)

        # Detect what's actually going on
        situation = detect_situation(text)
        is_mixed = detect_mixed_emotion(text)
        key_phrases = extract_key_phrases(text)
        
        # Build a contextual response
        sit_data = SITUATION_RESPONSES.get(situation, SITUATION_RESPONSES["general"])
        opener = random.choice(sit_data["openers"])
        follow_up = random.choice(sit_data["follow_ups"])
        
        # If mixed emotions detected, add a bridge
        if is_mixed:
            bridge = random.choice(MIXED_EMOTION_BRIDGES)
            response = f"{opener} {bridge} {follow_up}"
        else:
            response = f"{opener} {follow_up}"
        
        # Inject knowledge reference occasionally
        if knowledge and random.random() < 0.25:
            try:
                from app.models.memory import memory_manager
                insights = memory_manager.knowledge["insights"]
                if insights:
                    insight = random.choice(insights)
                    response += f" (I also remember you mentioned something about {insight['topic']}—if that's connected, I'm here for that too.)"
            except:
                pass
        
        if memory.is_repeating(response):
            response = f"{random.choice(self.escalations)}"
            
        memory.remember(response)
        return response

generator = ResponseGenerator()

def generate_response(emotion, action, text=None, context=None, knowledge=None):
    return generator.generate(emotion, action, text or "", context or "", knowledge)