import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: {bool(api_key)}")

client = genai.Client(api_key=api_key)
MODEL_NAME = "gemini-2.0-flash"

def test():
    text = "Im feeling happy"
    prompt = f"Analyze the emotion of this text: '{text}'. Categorize it into EXACTLY ONE of these: happy, sad, angry, anxious, neutral. Return only the word."
    try:
        response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        print(f"Input: '{text}'")
        print(f"Raw Response: '{response.text}'")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
