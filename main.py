import os
import re
import sys
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from pydantic import BaseModel
from transformers import pipeline
from langdetect import detect, detect_langs
from deep_translator import GoogleTranslator
import requests
from dotenv import load_dotenv

# Ensure UTF-8 output encoding for Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Load environment variables from .env file
load_dotenv()


app = FastAPI(title="MindShield AI - Stress & Distress Monitoring with Gemini")

# Allow CORS for frontends running on different ports or file protocol
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "MindShield Stress Monitoring API with Gemini is running. Visit /docs for API documentation."}

# ---------- Load local or HuggingFace models ----------
BASE = os.path.join(os.path.expanduser("~"), "Desktop", "models")
sentiment_path = os.path.join(BASE, "sentiment_model")
emotion_path = os.path.join(BASE, "emotion_model")

model_sentiment = sentiment_path if os.path.exists(sentiment_path) else "cardiffnlp/twitter-roberta-base-sentiment-latest"
model_emotion = emotion_path if os.path.exists(emotion_path) else "j-hartmann/emotion-english-distilroberta-base"

print("Loading Sentiment & Emotion Models...")
sentiment_model = pipeline("sentiment-analysis", model=model_sentiment)
emotion_model = pipeline("text-classification", model=model_emotion, top_k=None)
print("Models loaded successfully!")

# ---------- Crisis keywords (Multilingual) ----------
CRISIS_KEYWORDS = [
    # English
    "end my life", "can't go on", "want to die", "hurt myself", "no point living",
    "they will kill me", "suicide", "kill myself", "kill me", "want to end it",
    "end it all", "better off dead", "don't want to live", "wish i was dead",
    "nothing left to live for", "give up on life", "cut myself", "slit my wrist",
    # Hindi
    "मैं इस जिंदगी को खत्म करना चाहती हूं", "मैं इस जिंदगी को खत्म करना चाहता हूं",
    "जिंदगी को खत्म", "जिंदगी खत्म", "खत्म करना चाहती हूं", "खत्म करना चाहता हूं",
    "मरना चाहता हूं", "मरना चाहती हूं", "मर जाना", "जीना नहीं चाहता", "जीना नहीं चाहती",
    "आत्महत्या", "खुदकुशी", "जान दे दूंगा", "जान दे दूंगी", "जान देना",
    "और नहीं सह सकती", "और नहीं सह सकता", "बर्दाश्त नहीं",
    # Hinglish
    "mar jana chahta", "mar jana chahti", "zindagi khatam", "suicide karunga",
    "suicide karungi", "nahi jeena", "nahi sah sakti", "khatam karni hai",
    # Telugu
    "చనిపోవాలనుంది", "చంపేస్తాడు", "బ్రతకడం ఇష్టం లేదు", "ఆత్మహత్య", "తట్టుకోలేకపోతున్నా",
    # Tamil
    "சாகணும்", "கொல்லுவான்", "உயிரை மாய்ச்சுக்கணும்", "தாங்க முடியல", "தற்கொலை"
]

# ---------- Smart Language Detection Helper ----------
COMMON_ENGLISH_WORDS = {
    'hi', 'hello', 'hey', 'ok', 'okay', 'yes', 'no', 'help', 'thanks', 'thank', 'bye',
    'sad', 'bad', 'happy', 'hurt', 'die', 'depressed', 'stress', 'anxious', 'pain',
    'alone', 'scared', 'fear', 'please', 'sorry', 'good', 'fine', 'what', 'why',
    'how', 'can', 'you', 'i', 'am', 'feel', 'feeling', 'me', 'my', 'so', 'very',
    'much', 'too', 'need', 'want', 'talk', 'trouble', 'scared', 'worried', 'crying'
}

def detect_language_smart(text: str) -> str:
    text_str = text.strip()
    if not text_str:
        return 'en'
    
    # Check for non-ASCII characters (e.g. Indic scripts like Telugu, Hindi, Tamil, etc.)
    has_non_ascii = any(ord(c) > 127 for c in text_str)
    
    # Clean words to check for common English words
    cleaned_words = [w.lower().strip('.,!?\'"-') for w in text_str.split()]
    cleaned_words = [w for w in cleaned_words if w]
    
    # Heuristic for short ASCII text: default to English if words match or input is short ASCII
    if not has_non_ascii:
        if len(cleaned_words) <= 5 or len(text_str) <= 30:
            if any(w in COMMON_ENGLISH_WORDS for w in cleaned_words) or len(cleaned_words) <= 3:
                return 'en'
    
    # Use langdetect for longer text or non-ASCII text
    try:
        langs = detect_langs(text_str)
        if langs:
            top_lang = langs[0]
            # If top probability is weak for ASCII text, fall back to English
            if top_lang.prob < 0.65 and not has_non_ascii:
                return 'en'
            return top_lang.lang
    except Exception:
        pass
        
    return 'en'


# ---------- Fallback response templates & Smart Contextual Fallback ----------
FALLBACK_RESPONSES = {
    "high": ["That sounds really heavy to carry alone. Please know that you are not alone, and your feelings are valid. I'm here for you, and reaching out to a professional or helpline can help you navigate this."],
    "moderate": ["Thank you for sharing that with me. Stress can take a toll. Have you been able to take a short break, sleep, or try deep breathing exercises today?"],
    "stable": ["Good to hear from you. I am glad you are feeling relatively stable today. Is there anything specific on your mind you would like support with?"],
    "crisis": ["I hear how painful things are right now. Your safety and well-being are what matter most. Please connect with emergency services or a crisis helpline immediately — supportive people are available right now."]
}

def generate_contextual_fallback(text: str, distress_score: float, is_crisis: bool, band: str, history: list = None) -> str:
    """Generates context-aware, relevant fallback responses for follow-up prompts when Gemini API key is absent or unreachable."""
    lower_text = text.lower().strip()
    
    # 1. Check if user is asking about helplines or contact numbers
    helpline_keywords = ["helpline", "help line", "number", "phone", "contact", "call", "who to talk", "who to call", "where to get help", "emergency number"]
    if any(kw in lower_text for kw in helpline_keywords):
        return (
            "Here are supportive helplines available right now to assist you:\n"
            "1. Tele-MANAS (Govt Mental Health Helpline): 14416 or 1800 891 4416 (24/7 Toll-Free)\n"
            "2. Vandrevala Foundation Helpline: +91 9999 666 555 or 9152987821\n"
            "3. KIRAN Mental Health Helpline: 1800-599-0019\n"
            "You can also click the red Call Emergency Helpline button on the dashboard. Supportive people are ready to listen."
        )
    
    # 2. Check if user is asking about self-image, loneliness, feeling ugly/alone/unloved
    self_image_keywords = ["ugly", "alone", "nobody", "lonely", "no one", "worthless", "hate myself", "rejected"]
    if any(kw in lower_text for kw in self_image_keywords):
        return (
            "I hear how painful and overwhelming it feels right now. Feeling alone or having heavy thoughts about yourself is really hard, but please know that your worth is not defined by these difficult moments. "
            "You are not alone, and your feelings are completely valid. Would you like to share what triggered these thoughts today, or try a quick grounding exercise together?"
        )

    # 3. Check if user is asking actionable coping / what to do questions
    action_keywords = ["what should i do", "what to do", "how to stop", "how to handle", "help me", "so scared", "fear", "anxious"]
    if any(kw in lower_text for kw in action_keywords):
        return (
            "When anxiety or stress feels overwhelming, taking things one small step at a time helps. "
            "Try taking a slow, deep breath right now: inhale for 4 seconds, hold for 4, and exhale for 4. "
            "I am right here with you. What is feeling most difficult for you in this moment?"
        )

    # 4. Check prior turn history to build context-aware follow-up
    prior_context = ""
    if history:
        for turn in reversed(history[-4:]):
            turn_text = getattr(turn, 'text', turn.get('text', '') if isinstance(turn, dict) else '').lower()
            if any(kw in turn_text for kw in ["helpline", "help", "number", "call"]):
                return (
                    "Reaching out to a crisis helpline or a trusted professional is a strong and safe first step. "
                    "You can call Tele-MANAS at 14416 or Vandrevala Foundation at 9152987821 anytime 24/7. "
                    "How are you feeling right now as you consider reaching out?"
                )
            if any(kw in turn_text for kw in ["alone", "ugly", "sad", "stressed", "scared"]):
                prior_context = "I remember you mentioned feeling heavy earlier. "
                break

    # 5. Default band responses with context awareness
    if is_crisis:
        return prior_context + "Your safety and well-being are what matter most. Please reach out to emergency helplines like Tele-MANAS (14416) or connect with someone you trust right now."
    elif band == "high":
        return prior_context + "That sounds like a lot to carry. Please know you are not alone, and taking a short break or speaking with a counsellor can bring relief."
    elif band == "moderate":
        return prior_context + "Thank you for sharing that with me. Stress can take a real toll. Have you been able to take a short break, sleep, or try deep breathing today?"
    else:
        return prior_context + "I am here to listen and support you. Is there anything specific on your mind you would like to talk through?"


# ---------- System instructions for Gemini ----------
GEMINI_SYSTEM_INSTRUCTION = """
You are MindShield AI, a compassionate, empathetic, and gentle emotional support assistant designed specifically to help victims experiencing stress, depression, anxiety, trauma, or emotional distress.

STRICT BOUNDARY & KNOWLEDGE BASE RULES:
1. Your sole knowledge base and purpose is to assist victims with emotional distress, depression management, coping techniques, empathetic listening, grounding exercises, and safety resources.
2. You MUST NOT answer any general knowledge, technical, coding, mathematical, political, entertainment, or out-of-scope questions.
3. If a user asks something outside emotional distress / mental health / victim support (e.g., "Write Python code", "Who won the game?", "Solve math", "What is the capital of France?"), politely refuse by stating:
   "I am MindShield AI, specialized strictly for emotional support, stress relief, and victim assistance. I cannot assist with off-topic queries, but I am here if you need emotional support or someone to talk to."
4. DO NOT provide medical or psychiatric diagnoses or prescribe medications. Suggest professional counseling and crisis helplines when distress is high or critical.
5. Adapt your tone based on the provided distress metrics:
   - For high distress/crisis: Be extremely calming, validating, gentle, brief, and encourage safety and human connection.
   - For moderate stress: Offer practical grounding techniques (e.g., 5-4-3-2-1 grounding, deep breathing) and supportive conversation.
   - For stable/low distress: Provide encouraging and warm support.
6. Keep responses supportive, concise (2-4 sentences max unless detailed grounding is requested), warm, and clear.
"""

def query_gemini_api(user_message_english: str, distress_score: float, is_crisis: bool, sentiment_label: str, top_emotion: str, history: list = None) -> str:
    """Queries Google Gemini API with system instructions restricting scope strictly to emotional/depression support."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("[INFO] GEMINI_API_KEY is not set in .env. Using fallback template response.")
        return None

    # Format history turns for context continuity
    history_context = ""
    if history:
        history_lines = []
        for turn in history[-6:]:  # Use last 6 turns for context
            role = getattr(turn, 'role', turn.get('role', 'user') if isinstance(turn, dict) else 'user')
            text_val = getattr(turn, 'text', turn.get('text', '') if isinstance(turn, dict) else '')
            role_label = "User" if role in ["user", "human"] else "MindShield AI"
            if text_val:
                history_lines.append(f"{role_label}: {text_val}")
        if history_lines:
            history_context = "Prior Session Conversation History:\n" + "\n".join(history_lines) + "\n\n"

    # Try official google-genai SDK first if installed
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
{history_context}Current Victim Message: "{user_message_english}"
Context Metrics:
- Distress Score: {distress_score}/100
- Crisis Flag: {is_crisis}
- Sentiment: {sentiment_label}
- Primary Emotion: {top_emotion}

Respond as MindShield AI within your strictly restricted domain.
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=GEMINI_SYSTEM_INSTRUCTION,
                temperature=0.4,
                max_output_tokens=300,
            )
        )
        if response and response.text:
            return response.text.strip()
    except Exception as e1:
        print(f"genai SDK attempt failed/not present: {e1}. Trying REST endpoint...")

    # Fallback to direct Gemini REST API call
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        prompt_text = f"{GEMINI_SYSTEM_INSTRUCTION}\n\n{history_context}User Context:\n- Message: \"{user_message_english}\"\n- Distress Score: {distress_score}/100\n- Crisis Flag: {is_crisis}\n- Sentiment: {sentiment_label}\n- Primary Emotion: {top_emotion}\n\nPlease provide your empathetic, bounded response:"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt_text}]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 300
            }
        }
        res = requests.post(url, headers=headers, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
        else:
            print(f"Gemini REST API returned status {res.status_code}: {res.text}")
    except Exception as e2:
        print(f"Gemini REST API call error: {e2}")

    return None

# ---------- Safe translation helper ----------
def clean_contractions(text: str) -> str:
    contractions = {
        "you'd": "you would",
        "you're": "you are",
        "I'm": "I am",
        "can't": "cannot",
        "don't": "do not",
        "didn't": "did not",
        "—": "-",
        "–": "-"
    }
    for k, v in contractions.items():
        text = text.replace(k, v)
    return text

def translate_single_sentence(sentence: str, source: str, target: str) -> str:
    s = sentence.strip()
    if not s or source == target:
        return sentence
    cleaned = clean_contractions(s)
    for src in [source, "auto"]:
        try:
            res = GoogleTranslator(source=src, target=target).translate(cleaned)
            if res and not str(res).startswith("Error 500"):
                return res
        except Exception:
            continue
    return s

def safe_translate(text: str, source: str, target: str) -> str:
    if not text or source == target:
        return text
    parts = re.split(r'([.?!;\n]+)', text)
    result = []
    for i in range(0, len(parts), 2):
        chunk = parts[i]
        punc = parts[i+1] if i+1 < len(parts) else ""
        if chunk.strip():
            translated_chunk = translate_single_sentence(chunk, source, target)
            result.append(translated_chunk + punc)
        else:
            result.append(punc)
    return "".join(result).strip()

# ---------- Request format ----------
class ChatTurn(BaseModel):
    role: str
    text: str

class Message(BaseModel):
    case_id: str
    text: str
    history: Optional[List[ChatTurn]] = []

@app.post("/analyze")
def analyze(msg: Message):
    text = msg.text

    # 1. Detect language + translate to English
    lang = detect_language_smart(text)

    english_text = safe_translate(text, source=lang, target="en") if lang != "en" else text

    # 2. Crisis check
    is_crisis = any(kw in english_text.lower() for kw in CRISIS_KEYWORDS)

    # 3. Sentiment + emotion analysis
    sentiment = sentiment_model(english_text)[0]
    emotions = emotion_model(english_text)[0]

    # Find dominant emotion
    top_emotion = max(emotions, key=lambda x: x['score'])['label'] if emotions else "neutral"

    # 4. Calculate Distress score
    sentiment_score = sentiment['score'] * 100 if sentiment['label'] == 'negative' else (100 - sentiment['score'] * 100)
    emotion_weights = {'fear': 1.5, 'sadness': 1.4, 'anger': 1.2, 'disgust': 1.0, 'surprise': 0.5, 'joy': -1.0, 'neutral': 0}
    emotion_score = sum(e['score'] * emotion_weights.get(e['label'], 0) for e in emotions) * 40
    emotion_score = max(0, min(100, emotion_score))
    raw_score = (sentiment_score * 0.5) + (emotion_score * 0.5)
    if is_crisis:
        raw_score = max(raw_score, 90)
    distress_score = round(min(100, raw_score), 1)

    # 5. Determine Band
    if is_crisis:
        band = "crisis"
        recommendation = "Immediate crisis intervention & safety resources recommended."
    elif distress_score >= 70:
        band = "high"
        recommendation = "High distress detected. Counsellor support & active grounding advised."
    elif distress_score >= 40:
        band = "moderate"
        recommendation = "Moderate stress detected. Breathing exercises and self-care suggested."
    else:
        band = "stable"
        recommendation = "Stable emotional state. Regular check-ins recommended."

    # 6. Query Gemini API with restricted system instructions & context
    gemini_reply = query_gemini_api(
        user_message_english=english_text,
        distress_score=distress_score,
        is_crisis=is_crisis,
        sentiment_label=sentiment['label'],
        top_emotion=top_emotion,
        history=msg.history
    )

    # Fallback to smart contextual response if Gemini API key is absent or fails
    used_gemini = True
    if not gemini_reply:
        used_gemini = False
        gemini_reply = generate_contextual_fallback(
            text=english_text,
            distress_score=distress_score,
            is_crisis=is_crisis,
            band=band,
            history=msg.history
        )

    # 7. Translate reply back to victim's language
    reply_final = safe_translate(gemini_reply, source="en", target=lang) if lang != "en" else gemini_reply

    # 8. Generate comprehensive Sentiment Report
    sentiment_report = {
        "distress_score": distress_score,
        "band": band,
        "primary_emotion": top_emotion,
        "sentiment_label": sentiment['label'],
        "sentiment_confidence": round(sentiment['score'] * 100, 1),
        "language_detected": lang,
        "crisis_flag": is_crisis,
        "used_gemini": used_gemini,
        "recommendation": recommendation,
        "timestamp": datetime.utcnow().isoformat()
    }

    return {
        "case_id": msg.case_id,
        "language_detected": lang,
        "english_translation": english_text if lang != "en" else None,
        "sentiment": sentiment,
        "emotions": emotions,
        "distress_score": distress_score,
        "crisis_flag": is_crisis,
        "reply": reply_final,
        "used_gemini": used_gemini,
        "sentiment_report": sentiment_report,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/transcribe")
async def transcribe_audio(request: Request, lang: Optional[str] = "en-US"):
    """Handles audio file uploads from browser microphone recording in the user's selected language."""
    try:
        header_lang = request.headers.get("X-Voice-Lang")
        selected_lang = header_lang or lang or "en-US"
        
        content = await request.body()
        if not content or len(content) < 100:
            return {"success": False, "error": "No audio data recorded. Please speak into the mic."}
        
        # Language details map
        lang_info = {
            'te-IN': 'Telugu',
            'te': 'Telugu',
            'hi-IN': 'Hindi',
            'hi': 'Hindi',
            'en-US': 'English',
            'en': 'English',
            'es-ES': 'Spanish',
            'es': 'Spanish',
            'fr-FR': 'French',
            'fr': 'French',
            'ta-IN': 'Tamil',
            'ta': 'Tamil',
            'kn-IN': 'Kannada',
            'kn': 'Kannada',
            'ml-IN': 'Malayalam',
            'ml': 'Malayalam',
        }
        lang_name = lang_info.get(selected_lang, 'the selected language')

        # 1. Try Gemini API audio transcription if GEMINI_API_KEY is available
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if api_key:
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=api_key)
                mime_type = request.headers.get("content-type") or "audio/wav"
                prompt_text = (
                    f"Transcribe this spoken audio recording exactly into text in its original spoken language ({lang_name}). "
                    f"Output the text strictly in the native script/language of {lang_name}. Do NOT translate to English. "
                    "Return ONLY the transcribed spoken text in the original language and nothing else."
                )
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        types.Part.from_bytes(data=content, mime_type=mime_type),
                        prompt_text
                    ]
                )
                if response and response.text:
                    transcript = response.text.strip()
                    return {"success": True, "transcript": transcript}
            except Exception as ge:
                print(f"Gemini audio transcription error: {ge}")

        # 2. Try SpeechRecognition python package (uses Google free speech engine with specified language)
        try:
            import speech_recognition as sr
            import io
            r = sr.Recognizer()
            audio_file = io.BytesIO(content)
            with sr.AudioFile(audio_file) as source:
                audio_data = r.record(source)
                transcript = r.recognize_google(audio_data, language=selected_lang)
                if transcript and transcript.strip():
                    return {"success": True, "transcript": transcript.strip()}
        except Exception as se:
            print(f"SpeechRecognition error: {se}")

        return {"success": False, "error": "Could not recognize speech from audio. Please speak clearly into the microphone."}
    except Exception as e:
        print(f"Transcription endpoint error: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)