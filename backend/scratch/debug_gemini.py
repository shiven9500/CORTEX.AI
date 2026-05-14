import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: {bool(api_key)}")
if api_key:
    print(f"Key starts with: {api_key[:10]}...")

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-1.5-flash")

def test():
    text = "Im feeling happy"
    prompt = f"Analyze the emotion of this text: '{text}'. Categorize it into EXACTLY ONE of these: happy, sad, angry, anxious, neutral. Return only the word."
    try:
        response = model.generate_content(prompt)
        print(f"Input: '{text}'")
        print(f"Raw Response: '{response.text}'")
        print(f"Stripped: '{response.text.strip().lower()}'")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()