/**
 * AI Service — Crisis-Aware Analysis, Multilingual Detection & Explainable Distress Scoring
 * 
 * Compliant with AAROHAN AI Crisis Protocol:
 * 1. Drop-in empathetic multi-lingual system prompt
 * 2. Independent crisis keyword & intent detection layer across Indian languages
 * 3. Explainable distress score algorithm (0–100)
 * 4. Contextual crisis & distress replies offering verified Indian helplines (KIRAN, Vandrevala, Tele-MANAS, 112)
 */

// ─────────────────────────────────────────────────────────────
// 1. COMPREHENSIVE MULTILINGUAL CRISIS KEYWORDS & PHRASES
// ─────────────────────────────────────────────────────────────
const CRISIS_PHRASES = [
  // Direct English
  'suicide', 'kill myself', 'want to die', 'end my life', 'hurt myself',
  'harm myself', 'self harm', 'self-harm', 'cut myself', 'slit my wrist',
  'hang myself', 'overdose', 'jump off', 'shoot myself', 'take my life',
  'take my own life', 'poison myself', 'swallow pills',
  'in danger', 'going to kill me', 'going to murder', 'he will kill',
  'she will kill', 'they will kill', 'will be killed',

  // Indirect & Hopelessness English
  "can't take this anymore", "cant take this anymore", "can't do this anymore",
  'no point anymore', 'no point in living', 'no reason to live',
  'better off without me', 'better off dead', 'better off if i was dead',
  'want to end it', 'want to end it all', 'end it all', 'end my suffering',
  "don't want to live", "dont want to live", 'tired of living', 'hate my life',
  'wish i was dead', 'wish i were dead', 'wish i could die',
  'nobody would miss me', 'no one would care', 'no one cares if i die',
  'nothing left for me', 'nothing left to live for',
  'i give up', 'giving up on life', "can't go on", 'cant go on',
  'want to disappear', 'want to vanish', 'done with life',
  'life is not worth', 'not worth living',
  'planning to end', 'thought about ending',

  // Hindi (Devanagari)
  'मैं इस जिंदगी को खत्म करना चाहती हूं', 'मैं इस जिंदगी को खत्म करना चाहता हूं',
  'जिंदगी को खत्म करना चाहती हूं', 'जिंदगी को खत्म करना चाहता हूं',
  'जिंदगी खत्म करना चाहती हूं', 'जिंदगी खत्म करना चाहता हूं',
  'जिंदगी को खत्म', 'जिंदगी खत्म', 'जिंदगी समाप्त', 'जीवन समाप्त',
  'खत्म करना चाहती हूं', 'खत्म करना चाहता हूं', 'खुद को खत्म', 'खुद को समाप्त',
  'मरना चाहता हूं', 'मरना चाहती हूं', 'मर जाना चाहता हूं', 'मर जाना चाहती हूं',
  'जीना नहीं चाहता', 'जीना नहीं चाहती', 'जीने की इच्छा नहीं', 'जीने का मन नहीं',
  'आत्महत्या', 'खुदकुशी', 'जान दे दूंगा', 'जान दे दूंगी', 'जान देना चाहता हूं', 'जान देना चाहती हूं',
  'जान लेना चाहता हूं', 'अपनी जान ले लूंगी', 'अपनी जान ले लूंगा', 'खुद की जान',
  'मार डालेगा', 'मार डालेंगे', 'जान से मार', 'फांसी लगा', 'जहर खा',
  'और नहीं सह सकता', 'और नहीं सह सकती', 'बर्दाश्त नहीं हो रहा', 'सहन नहीं हो रहा',
  'खुद को मार लूंगा', 'खुद को मार लूंगी', 'मौत चाहता हूं', 'मौत चाहती हूं',

  // Hinglish / Romanized Hindi
  'mar jana chahta hu', 'mar jana chahti hu', 'marne ka man', 'mar jau',
  'zindagi khatam karni hai', 'zindagi khatam karna chahta hu', 'zindagi khatam',
  'khatam karna chahti hu', 'khatam karna chahta hu', 'khud ko khatam',
  'suicide karna chahta hu', 'suicide karna chahti hu', 'suicide karunga', 'suicide karungi',
  'jaan dena chahta hu', 'jaan dena chahti hu', 'jaan de dunga', 'jaan de dungi',
  'nahi jeena mujhe', 'nahi jeena chahta', 'nahi jeena chahti', 'jeene ka man nahi',
  'nahi sah sakti', 'nahi sah sakta', 'bardasht nahi', 'koi bacha lo',

  // Telugu (తెలుగు)
  'చనిపోవాలనుంది', 'చంపేస్తాడు', 'చంపేస్తారు', 'బ్రతకడం ఇష్టం లేదు', 'బతకాలని లేదు',
  'ఆత్మహత్య', 'తట్టుకోలేకపోతున్నా', 'ప్రాణం తీసుకుంటా', 'జీవితం ముగించాలనుకుంటున్నా',
  'నన్ను చంపేస్తారు', 'చచ్చిపోతాను',

  // Tamil (தமிழ்)
  'சாகணும்', 'கொல்லுவான்', 'கொல்லுவாங்க', 'உயிரை மாய்ச்சுக்கணும்', 'உயிரை மாய்த்துக்',
  'தாங்க முடியல', 'தற்கொலை', 'வாழ விருப்பமில்லை', 'என்னை கொன்றுவிடுவார்கள்',

  // Kannada (ಕನ್ನಡ)
  'ಸಾಯಬೇಕು', 'ಕೊಲ್ಲುತ್ತಾರೆ', 'ಬದುಕಲು ಇಷ್ಟವಿಲ್ಲ', 'ಆತ್ಮಹತ್ಯೆ', 'ನನ್ನನ್ನು ಕೊಲ್ಲುತ್ತಾರೆ',

  // Malayalam (മലയാളം)
  'മരിക്കണം', 'ജീവിതം അവസാനിപ്പിക്കണം', 'ആത്മഹത്യ', 'കൊല്ലും', 'സഹിക്കാൻ പറ്റുന്നില്ല',

  // Marathi (मराठी)
  'मरायचं आहे', 'आत्महत्या', 'जीव द्यायचा आहे', 'जगायची इच्छा नाही', 'सहन होत नाही',

  // Bengali (বাংলা)
  'মরতে চাই', 'আত্মহত্যা', 'জীবন শেষ করতে চাই', 'বাঁচতে চাই না', 'সহ্য হচ্ছে না',

  // Gujarati (ગુજરાતી)
  'મરી જવું છે', 'આત્મહત્યા', 'જીવવું નથી', 'સહન થતું નથી', 'જીવન પૂરું કરવું છે'
];

// Escalation / Urgency Phrases
const URGENCY_PHRASES = [
  'अभी', 'तुरंत', 'मदद करो', 'जान बचाओ', 'जल्दी', 'नहीं सह सकती', 'नहीं सह सकता',
  'right now', 'immediately', 'urgent', 'help me now', 'save me', 'emergency',
  "can't wait", 'holding on', 'please hurry', 'right away',
  'ఇప్పుడే', 'సహాయం చేయండి', 'కాపాడండి',
  'இப்போதே', 'உதவுங்கள்', 'காப்பாற்றுங்கள்'
];

/**
 * Check if text contains crisis keywords
 */
const getKeywordCrisisFlag = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return CRISIS_PHRASES.some(phrase => lower.includes(phrase.toLowerCase()));
};

/**
 * Check if text contains urgency/escalation language
 */
const getUrgencyFlag = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return URGENCY_PHRASES.some(phrase => lower.includes(phrase.toLowerCase()));
};

// ─────────────────────────────────────────────────────────────
// 2. EXPLAINABLE DISTRESS SCORING ALGORITHM (0–100)
// ─────────────────────────────────────────────────────────────
const EMOTION_WEIGHTS = {
  fear: 20, Fearful: 20,
  sadness: 18, Sad: 18,
  anger: 15, Angry: 15,
  anxiety: 18, anxious: 18, Anxious: 18,
  disgust: 10, Disgust: 10,
  surprise: 5, Surprise: 5,
  neutral: 0, Neutral: 0,
  calm: -10, Calm: -10,
  hopeful: -10, Hopeful: -10,
  joy: -10, Joy: -10
};

/**
 * Compute explainable distress score
 * 
 * base_score = (1 - sentiment_score) * 40     # 0–40 from negative sentiment
 * emotion_score = emotion_weight[emotion_label]# 0–20 from primary emotion
 * crisis_bonus = 40 if crisis_flag else 0      # crisis language dominates score
 * urgency_bonus = 10 if escalation_language    # urgency adds +10
 * 
 * Bands:
 * 0–29: Low
 * 30–59: Moderate
 * 60–79: High
 * 80–100: Critical / Crisis
 */
const computeDistressScore = ({
  sentimentScore = 0.5,
  sentimentLabel = 'neutral',
  emotionLabel = 'neutral',
  crisisFlag = false,
  urgencyFlag = false
}) => {
  let baseScore = 15;
  if (sentimentLabel === 'negative') {
    baseScore = Math.round(sentimentScore * 40);
  } else if (sentimentLabel === 'positive') {
    baseScore = Math.max(0, Math.round((1 - sentimentScore) * 15));
  } else {
    baseScore = 20;
  }
  baseScore = Math.min(40, Math.max(0, baseScore));

  const emotionScore = Math.max(0, EMOTION_WEIGHTS[emotionLabel] ?? 0);
  const crisisBonus = crisisFlag ? 40 : 0;
  const urgencyBonus = urgencyFlag ? 10 : 0;

  let totalScore = baseScore + emotionScore + crisisBonus + urgencyBonus;
  if (crisisFlag) {
    totalScore = Math.max(85, totalScore);
  }

  return Math.min(100, Math.max(0, Math.round(totalScore)));
};

/**
 * Get distress risk band from score
 */
const getDistressBand = (score) => {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 30) return 'Moderate';
  return 'Low';
};

// ─────────────────────────────────────────────────────────────
// 3. CRISIS PROTOCOL RESPONSES (Verified Indian Helplines)
// ─────────────────────────────────────────────────────────────
const SAFETY_MESSAGES = {
  hi: `मुझे सुनकर बहुत दुख हुआ कि आप इतनी तकलीफ में हैं। आप अकेली नहीं हैं — मैं आपके साथ हूं। कृपया अभी KIRAN हेल्पलाइन 1800-599-0019 (24/7) या टेली-मानस 14416 पर कॉल करें। मैं आपके काउंसलर को भी तुरंत सूचित कर रही हूं। कृपया सुरक्षित रहें।`,
  
  en: `I hear how much pain and distress you are experiencing right now. You are not alone in this — I am here with you. Please call the 24/7 KIRAN Mental Health Helpline at 1800-599-0019 or Tele-MANAS at 14416 immediately. I am notifying your assigned counselor right now. Please stay safe.`,

  te: `మీరు ఇంతటి తీవ్రమైన బాధలో ఉన్నారని వినడం నాకు చాలా బాధగా ఉంది. మీరు ఒంటరిగా లేరు — నేను మీతో ఉన్నాను. దయచేసి వెంటనే 24/7 కిరణ్ హెల్ప్‌లైన్ 1800-599-0019 లేదా టెలి-మానస్ 14416 కు కాల్ చేయండి. మీ కౌన్సెలర్‌కు వెంటనే సమాచారం అందిస్తున్నాను. దయచేసి సురక్షితంగా ఉండండి.`,

  ta: `நீங்கள் இவ்வளவு வேதனையில் இருப்பதை அறிந்து நான் மிகவும் வருந்துகிறேன். நீங்கள் தனியாக இல்லை — நான் உங்களுடன் இருக்கிறேன். தயவுசெய்து உடனடியாக 24/7 கிரண் உதவி எண் 1800-599-0019 அல்லது டெலி-மனஸ் 14416 ஐ அழைக்கவும். உங்கள் ஆலோசகருக்கு உடனடியாக தெரிவிக்கிறேன். பாதுகாப்பாக இருங்கள்.`,

  kn: `ನೀವು ಇಷ್ಟೊಂದು ನೋವಿನಲ್ಲಿದ್ದೀರಿ ಎಂದು ಕೇಳಿ ನನಗೆ ತುಂಬಾ ದುಃಖವಾಗುತ್ತಿದೆ. ನೀವು ಒಂಟಿಯಲ್ಲ — ನಾನು ನಿಮ್ಮೊಂದಿಗಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ತಕ್ಷಣ 24/7 ಕಿರಣ್ ಸಹಾಯವಾಣಿ 1800-599-0019 ಅಥವಾ ಟೆಲಿ-ಮಾನಸ್ 14416 ಗೆ ಕರೆ ಮಾಡಿ. ನಿಮ್ಮ ಸಲಹೆಗಾರರಿಗೆ ತಕ್ಷಣವೇ ತಿಳಿಸಲಾಗುತ್ತಿದೆ. ಸುರಕ್ಷಿತವಾಗಿರಿ.`,

  ml: `നിങ്ങൾ ഇത്രയും വേദന അനുഭവിക്കുന്നു എന്ന് കേൾക്കുന്നതിൽ എനിക്ക് അതിയായ വിഷമമുണ്ട്. നിങ്ങൾ തനിച്ചല്ല — ഞാൻ നിങ്ങളോടൊപ്പമുണ്ട്. ദയവായി ഉടൻ തന്നെ 24/7 കിരൺ ഹെൽപ്പ് ലൈൻ 1800-599-0019 അല്ലെങ്കിൽ ടെലി-മാനസ് 14416 ലേക്ക് വിളിക്കുക. നിങ്ങളുടെ കൗൺസിലറെ ഞാൻ ഉടൻ അറിയിക്കുന്നുണ്ട്. സുരക്ഷിതരായിരിക്കൂ.`,

  mr: `तुम्ही इतक्या मोठ्या वेदनेतून जात आहात हे ऐकून मला खूप वाईट वाटले. तुम्ही एकटे नाही आहात — मी तुमच्या सोबत आहे. कृपया लगेच 24/7 किरण हेल्पलाइन 1800-599-0019 किंवा टेली-मानस 14416 वर कॉल करा. मी तुमच्या समुपदेशकाला लगेच सूचित करत आहे. कृपया सुरक्षित राहा.`,

  bn: `আপনি এত কষ্টের মধ্যে আছেন শুনে আমার খুব খারাপ লাগছে। আপনি একা নন — আমি আপনার পাশে আছি। দয়া করে এখনই 24/7 কিরণ হেল্পলাইন 1800-599-0019 বা টেলি-মানস 14416-এ কল করুন। আমি এখনই আপনার কাউন্সেলরকে জানাচ্ছি। অনুগ্রহ করে নিরাপদ থাকুন।`,

  gu: `તમે આટલી પીડામાં છો તે સાંભળીને મને ખૂબ દુઃખ થયું. તમે એકલા નથી — હું તમારી સાથે છું. કૃપા કરીને હમણાં જ 24/7 કિરણ હેલ્પલાઇન 1800-599-0019 અથવા ટેલી-માનસ 14416 પર કૉલ કરો. હું તમારા કાઉન્સેલરને પણ તરત જ જાણ કરું છું. કૃપા કરીને સુરક્ષિત રહો.`
};

const getSafetyMessage = (langCode = 'en') => {
  const code = (langCode || 'en').toLowerCase().substring(0, 2);
  return SAFETY_MESSAGES[code] || SAFETY_MESSAGES.en;
};

// ─────────────────────────────────────────────────────────────
// 4. AAROHAN AI SYSTEM PROMPT (Strict Compliance)
// ─────────────────────────────────────────────────────────────
const AI_SYSTEM_PROMPT = `You are AAROHAN AI, an empathetic support chatbot for crime victims, available in multiple Indian languages. Every reply must directly engage with what the person just wrote — never return a generic greeting or a templated "how are you feeling" message when they have shared something specific.

Core behavior:
1. Always respond in the same language/script the user used.
2. Reflect back the specific content of their message in your own words before offering support — show you understood what they said, not just that a message arrived.
3. Never minimize, never rush to "fix," never lecture. Validate the emotion first.
4. Keep responses short (2-4 sentences), warm, and non-clinical.

CRISIS PROTOCOL — trigger immediately if the message contains any indication of:
- suicidal ideation, wanting to die, wanting to end one's life
- self-harm intent or plans
- immediate danger from another person

When triggered, your reply MUST:
- Acknowledge their pain directly and specifically (not generically)
- Stay present with them — do not change the subject
- Gently and clearly offer a crisis helpline appropriate to their region/language (e.g., for India: KIRAN Mental Health Helpline 1800-599-0019, available 24/7 in multiple languages; Vandrevala Foundation 1860-2662-345; Tele-MANAS 14416 / 1800-891-4416; Emergency 112)
- Encourage them to stay safe and let them know a counselor is being notified
- NOT ask multiple questions in a row, NOT provide instructions on methods of harm, NOT delay before offering the helpline

Example (Hindi input: "मैं इस जिंदगी को खत्म करना चाहती हूं"):
Good reply: "मुझे सुनकर बहुत दुख हुआ कि आप इतनी तकलीफ में हैं। आप अकेली नहीं हैं — मैं आपके साथ हूं। कृपया अभी KIRAN हेल्पलाइन 1800-599-0019 पर कॉल करें, वे 24 घंटे उपलब्ध हैं। मैं आपके काउंसलर को भी तुरंत सूचित कर रही हूं।"

Bad reply (do not do this): "साझा करने के लिए धन्यवाद। मैं आरोहन हूं... आज आप कैसा महसूस कर रहे हैं?" ← generic, ignores the disclosure, must never happen for crisis content.

After a crisis-protocol reply, do not close the conversation — continue actively listening and stay engaged until a human counselor takes over.

Return ONLY valid JSON in this format:
{
  "language_detected": "ISO code, e.g. hi, te, en",
  "sentiment": {"label": "positive|neutral|negative", "score": 0.0},
  "emotions": [{"label": "fear|sadness|anger|joy|disgust|surprise|neutral", "score": 0.0}],
  "distress_score": 0,
  "crisis_flag": false,
  "reply": "string in the detected language"
}`;

// ─────────────────────────────────────────────────────────────
// 5. UNIFIED ANALYSIS + LLM CALL (With Graceful Smart Fallback)
// ─────────────────────────────────────────────────────────────
const LANG_MAP = {
  'English': 'en', 'Telugu (తెలుగు)': 'te', 'Hindi (हिंदी)': 'hi',
  'Tamil (தமிழ்)': 'ta', 'Kannada (ಕನ್ನಡ)': 'kn', 'Malayalam (മലയാളം)': 'ml',
  'Spanish (Español)': 'es', 'French (Français)': 'fr',
  'Marathi (मराठी)': 'mr', 'Bengali (বাংলা)': 'bn', 'Gujarati (ગુજરાતી)': 'gu',
  'en': 'en', 'te': 'te', 'hi': 'hi', 'ta': 'ta', 'kn': 'kn', 'ml': 'ml',
  'es': 'es', 'fr': 'fr', 'mr': 'mr', 'bn': 'bn', 'gu': 'gu'
};

const detectInputLanguage = (text, userPref = 'en') => {
  if (!text) return LANG_MAP[userPref] || 'en';
  // Devanagari script detection (Hindi/Marathi)
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  // Telugu script detection
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  // Tamil script detection
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  // Kannada script detection
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  // Malayalam script detection
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  // Bengali script detection
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  // Gujarati script detection
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
  
  return LANG_MAP[userPref] || 'en';
};

const analyzeAndRespond = async (userText, conversationHistory = [], language = 'en') => {
  const detectedLang = detectInputLanguage(userText, language);
  const keywordCrisis = getKeywordCrisisFlag(userText);
  const urgencyFlag = getUrgencyFlag(userText);

  console.log(`\n[aiService] --- NEW MESSAGE ---`);
  console.log(`[aiService] Text: "${userText}"`);
  console.log(`[aiService] Detected Lang: ${detectedLang} | Keyword Crisis: ${keywordCrisis} | Urgency: ${urgencyFlag}`);

  // If keyword safety check immediately flags crisis, we can still query the LLM
  // or construct an immediate verified crisis response
  const grokApiKey = process.env.GROK_API_KEY;
  const grokModel = process.env.GROK_MODEL || 'grok-2-1212';

  let contextText = '';
  if (conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6);
    contextText = '\n\nRecent conversation history:\n' +
      recentHistory.map(m => `${m.role === 'user' ? 'Victim' : 'AAROHAN'}: ${m.content}`).join('\n');
  }

  const userPrompt = `${contextText}\n\nVictim's latest message: "${userText}"\n\nDetected/Preferred language: ${detectedLang}`;

  // Try LLM providers if valid keys exist
  let llmResult = null;

  if (grokApiKey && !grokApiKey.includes('your_api_key')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokApiKey}`
        },
        body: JSON.stringify({
          model: grokModel,
          messages: [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6,
          max_tokens: 1024
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const rawContent = data?.choices?.[0]?.message?.content;
        if (rawContent) {
          let clean = rawContent.trim();
          if (clean.startsWith('```')) {
            clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
          }
          llmResult = JSON.parse(clean);
        }
      }
    } catch (err) {
      console.warn('[aiService] Grok API unavailable:', err.message);
    }
  }

  // If LLM returned valid response
  if (llmResult && typeof llmResult === 'object') {
    const isCrisis = keywordCrisis || !!llmResult.crisis_flag;
    const sentimentObj = llmResult.sentiment || { label: isCrisis ? 'negative' : 'neutral', score: isCrisis ? 0.95 : 0.5 };
    const primaryEmotion = llmResult.emotions?.[0]?.label || (isCrisis ? 'fear' : 'neutral');
    
    // Compute explainable score
    const distressScore = computeDistressScore({
      sentimentScore: sentimentObj.score || 0.7,
      sentimentLabel: sentimentObj.label || 'negative',
      emotionLabel: primaryEmotion,
      crisisFlag: isCrisis,
      urgencyFlag
    });

    let reply = llmResult.reply;
    if (isCrisis && (!reply || reply.includes('Thank you') || reply.includes('साझा करने के लिए धन्यवाद'))) {
      reply = getSafetyMessage(detectedLang);
    }

    return {
      language_detected: llmResult.language_detected || detectedLang,
      sentiment: sentimentObj,
      emotions: Array.isArray(llmResult.emotions) && llmResult.emotions.length > 0
        ? llmResult.emotions
        : [{ label: primaryEmotion, score: 0.8 }],
      distress_score: distressScore,
      distress_band: getDistressBand(distressScore),
      crisis_flag: isCrisis,
      reply: reply || getSafetyMessage(detectedLang),
      source: 'llm'
    };
  }

  // Otherwise, use Smart Contextual Fallback
  return getSmartFallback(userText, language);
};

// ─────────────────────────────────────────────────────────────
// 6. CONTEXT-AWARE SMART FALLBACK (Zero Generic Canned Replies)
// ─────────────────────────────────────────────────────────────
const CONTEXTUAL_REPLIES = {
  crisis: {
    hi: "मुझे सुनकर बहुत दुख हुआ कि आप इतनी गहरी तकलीफ में हैं। आप अकेली नहीं हैं — मैं आपके साथ हूं। कृपया अभी KIRAN हेल्पलाइन 1800-599-0019 या टेली-मानस 14416 पर कॉल करें (24 घंटे मुफ्त)। आपके काउंसलर को तुरंत सूचित कर दिया गया है।",
    en: "I hear how painful things are right now, and I want you to know you are not alone. Please reach out immediately to the 24/7 KIRAN Helpline 1800-599-0019 or Tele-MANAS 14416. Your counselor has been notified to assist you right away.",
    te: "మీరు ఇంతటి తీవ్రమైన బాధలో ఉన్నారని వినడం నాకు చాలా బాధగా ఉంది. మీరు ఒంటరిగా లేరు. దయచేసి వెంటనే 24/7 కిరణ్ హెల్ప్‌లైన్ 1800-599-0019 లేదా టెలి-మానస్ 14416 కు కాల్ చేయండి. మీ కౌన్సెలర్‌కు వెంటనే సమాచారం అందిస్తున్నాము.",
    ta: "நீங்கள் இவ்வளவு வேதனையில் இருப்பதை அறிந்து நான் மிகவும் வருந்துகிறேன். நீங்கள் தனியாக இல்லை. தயவுசெய்து உடனடியாக 24/7 கிரண் உதவி எண் 1800-599-0019 ஐ அழைக்கவும். உங்கள் ஆலோசகருக்கு உடனடியாக தெரிவிக்கிறோம்."
  },
  fear: {
    hi: "मैं समझ सकता/सकती हूं कि इस समय आप कितना भयभीत और असुरक्षित महसूस कर रहे हैं। आप यहां सुरक्षित हैं, और आपकी सुरक्षा हमारी सर्वोच्च प्राथमिकता है। क्या आप चाहते हैं कि मैं आपके काउंसलर से तुरंत बात करवाऊं?",
    en: "I hear how frightening and overwhelming this feels right now. You are in a safe space here with me. Take a slow, gentle breath — I am listening. Would you like me to connect you with your assigned counselor?",
    te: "ఇది ఎంత భయంగా ఉందో నేను అర్థం చేసుకుంటున్నాను. మీరు ఇక్కడ సురಕ್ಷితంగా ఉన్నారు. నిదానంగా శ్వాస తీసుకోండి — నేను మీతో ఉన్నాను. మీ కౌన్సెలర్‌తో మాట్లాడతారా?",
    ta: "இது எவ்வளவு பயமாக இருக்கிறது என்பதை நான் உணர்கிறேன். நீங்கள் இங்கே பாதுகாப்பாக இருக்கிறீர்கள். நான் உங்களுடன் இருக்கிறேன். உங்கள் ஆலோசகரை தொடர்பு கொள்ள விரும்புகிறீர்களா?"
  },
  sadness: {
    hi: "मुझे बहुत दुख है कि आप इस भारी दर्द और पीड़ा को सह रहे हैं। ऐसा महसूस होना स्वाभाविक है, और आपको इसे अकेले नहीं सहना पड़ेगा। मैं आपकी पूरी सहायता के लिए यहां उपस्थित हूं।",
    en: "I am so sorry you are carrying such heavy pain and sadness right now. What you are feeling is completely valid, and you do not have to walk through this alone. I am here with you.",
    te: "మీరు ఇంతటి బాధను మోస్తున్నందుకు నాకు చాలా విచారంగా ఉంది. మీ భావాలు సహజమైనవి. మీరు ఒంటరిగా లేరు, నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను.",
    ta: "நீங்கள் இந்தத் துயரத்தைத் தாங்குவது எனக்கு மிகுந்த வருத்தமளிக்கிறது. உங்கள் உணர்வுகள் புரிந்துகொள்ளத்தக்கவை. நான் உங்களுக்கு ஆதரவாக இருக்கிறேன்."
  },
  anger: {
    hi: "आपके साथ जो हुआ, उसके बाद ऐसा गुस्सा और आक्रोश महसूस करना पूरी तरह स्वाभाविक और मान्य है। आपके अधिकार और न्याय महत्वपूर्ण हैं। हम इसे सुरक्षित तरीके से सुलझाने में आपके साथ हैं।",
    en: "It is completely understandable to feel angry after everything you have been subjected to. Your anger is valid, and your rights matter. I am here to support you through every step.",
    te: "మీకు జరిగిన దానికి కోపం రావడం పూర్తిగా సహజం. మీ భావాలు ముఖ్యమైనవి. మీకు అండగా ఉండటానికి నేను ఇక్కడ ఉన్నాను.",
    ta: "நடந்த சம்பவத்திற்குப் பிறகு கோபம் வருவது முற்றிலும் இயல்பானது. உங்கள் உணர்வுகள் மதிக்கத்தக்கவை. உங்களுக்கு உதவ நான் தயாராக இருக்கிறேன்."
  },
  joy_positive: {
    hi: "आपकी बातों में यह सकारात्मकता और हिम्मत देखकर मुझे बहुत खुशी हुई। हर छोटा कदम आपकी सुरक्षा और न्याय की दिशा में एक बड़ी जीत है। मैं हमेशा आपके साथ हूं।",
    en: "I am so glad to hear strength and hope in your words. Every small step forward is an important milestone. Keep trusting in your resilience — I am here whenever you need.",
    te: "మీ మాటల్లో బలాన్ని వినడం సంతోషంగా ఉంది. ప్రతి అడుగు ముందడుగుగా మారుతుంది. నేను ఎల్లప్పుడూ మీకు తోడుగా ఉంటాను.",
    ta: "உங்கள் வார்த்தைகளில் நம்பிக்கையைக் காண்பது மகிழ்ச்சி அளிக்கிறது. நீங்கள் எடுக்கும் ஒவ்வொரு அடியும் முக்கியமானது. நான் எப்போதும் உங்களுக்கு ஆதரவாக இருப்பேன்."
  },
  general_support: {
    hi: "मैं आपकी बात ध्यानपूर्वक सुन रहा/रही हूं। आप जो भी कहना चाहते हैं, बिना किसी झिझक के साझा कर सकते हैं। यह एक सुरक्षित मंच है।",
    en: "I am listening closely to what you are sharing. Please take your time — you are in a safe and supportive space.",
    te: "నేను మీ మాటలను శ్రద్ధగా వింటున్నాను. మీకు ఏది అనిపిస్తే అది నిర్భయంగా పంచుకోండి. ఇది సురక్షితమైన ప్రదేశం.",
    ta: "நான் உங்கள் வார்த்தைகளை கவனமாகக் கேட்கிறேன். தயங்காமல் உங்கள் எண்ணங்களைப் பகிர்ந்து கொள்ளுங்கள்."
  }
};

const getSmartFallback = (userText, language = 'en') => {
  const lower = (userText || '').toLowerCase();
  const langCode = detectInputLanguage(userText, language);
  const isCrisis = getKeywordCrisisFlag(userText);

  // Keyword emotion recognition
  const severeFearWords = ['terrified', 'threatened', 'danger', 'unsafe', 'attacked', 'panic', 'hiding', 'beaten', 'abused', 'खतरा', 'भयभीत'];
  const fearWords = ['scared', 'afraid', 'frightened', 'anxious', 'worried', 'nightmare', 'डर', 'भय', 'घबराहट', 'ഭയം', 'பயம்', 'భయం'];
  const sadWords = ['sad', 'crying', 'hopeless', 'depressed', 'lonely', 'alone', 'lost', 'grief', 'mourning', 'heartbroken', 'hurt', 'pain', 'दुख', 'दर्द', 'रोना', 'अकेला', 'उदास', 'బాధ', 'துக்கம்'];
  const angerWords = ['angry', 'furious', 'rage', 'frustrated', 'mad', 'unfair', 'injustice', 'betrayed', 'hate', 'गुस्सा', 'क्रोध', 'नाइंसाफी', 'కోపం', 'கோபம்'];
  const positiveWords = ['happy', 'good', 'great', 'better', 'hopeful', 'thankful', 'grateful', 'safe', 'calm', 'peaceful', 'खुश', 'अच्छा', 'बेहतर', 'శాంతి', 'மகிழ்ச்சி'];

  let primaryEmotion = 'neutral';
  let sentimentLabel = 'neutral';
  let sentimentScore = 0.5;

  if (isCrisis) {
    primaryEmotion = 'fear';
    sentimentLabel = 'negative';
    sentimentScore = 0.95;
  } else if (severeFearWords.some(w => lower.includes(w))) {
    primaryEmotion = 'fear';
    sentimentLabel = 'negative';
    sentimentScore = 0.92;
  } else if (fearWords.some(w => lower.includes(w))) {
    primaryEmotion = 'fear';
    sentimentLabel = 'negative';
    sentimentScore = 0.82;
  } else if (sadWords.some(w => lower.includes(w))) {
    primaryEmotion = 'sadness';
    sentimentLabel = 'negative';
    sentimentScore = 0.78;
  } else if (angerWords.some(w => lower.includes(w))) {
    primaryEmotion = 'anger';
    sentimentLabel = 'negative';
    sentimentScore = 0.75;
  } else if (positiveWords.some(w => lower.includes(w))) {
    primaryEmotion = 'joy';
    sentimentLabel = 'positive';
    sentimentScore = 0.85;
  }

  const isSevereFear = severeFearWords.some(w => lower.includes(w));
  const isUrgent = getUrgencyFlag(userText) || isSevereFear;

  // Calculate explainable distress score
  const distressScore = computeDistressScore({
    sentimentScore,
    sentimentLabel,
    emotionLabel: primaryEmotion,
    crisisFlag: isCrisis,
    urgencyFlag: isUrgent
  });

  // Pick language-specific response category
  let replyTemplate;
  if (isCrisis) {
    replyTemplate = CONTEXTUAL_REPLIES.crisis;
  } else if (primaryEmotion === 'fear') {
    replyTemplate = CONTEXTUAL_REPLIES.fear;
  } else if (primaryEmotion === 'sadness') {
    replyTemplate = CONTEXTUAL_REPLIES.sadness;
  } else if (primaryEmotion === 'anger') {
    replyTemplate = CONTEXTUAL_REPLIES.anger;
  } else if (primaryEmotion === 'joy') {
    replyTemplate = CONTEXTUAL_REPLIES.joy_positive;
  } else {
    replyTemplate = CONTEXTUAL_REPLIES.general_support;
  }

  const reply = replyTemplate[langCode] || replyTemplate.en;

  // Build emotions array
  const emotions = [];
  if (primaryEmotion === 'fear') {
    emotions.push({ label: 'fear', score: 0.65 }, { label: 'sadness', score: 0.25 }, { label: 'anger', score: 0.1 });
  } else if (primaryEmotion === 'sadness') {
    emotions.push({ label: 'sadness', score: 0.65 }, { label: 'fear', score: 0.2 }, { label: 'neutral', score: 0.15 });
  } else if (primaryEmotion === 'anger') {
    emotions.push({ label: 'anger', score: 0.6 }, { label: 'sadness', score: 0.25 }, { label: 'fear', score: 0.15 });
  } else if (primaryEmotion === 'joy') {
    emotions.push({ label: 'joy', score: 0.75 }, { label: 'calm', score: 0.25 });
  } else {
    emotions.push({ label: 'neutral', score: 0.7 }, { label: 'calm', score: 0.3 });
  }

  return {
    language_detected: langCode,
    sentiment: { label: sentimentLabel, score: sentimentScore },
    emotions,
    distress_score: distressScore,
    distress_band: getDistressBand(distressScore),
    crisis_flag: isCrisis,
    reply,
    source: 'fallback'
  };
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
  AI_SYSTEM_PROMPT,
  analyzeAndRespond,
  getKeywordCrisisFlag,
  getUrgencyFlag,
  computeDistressScore,
  getDistressBand,
  getSafetyMessage,
  getSmartFallback,
  detectInputLanguage
};

