import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LANGUAGES = [
  { code: 'en-US', langKey: 'en', label: 'English' },
  { code: 'hi-IN', langKey: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'te-IN', langKey: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'ta-IN', langKey: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'kn-IN', langKey: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml-IN', langKey: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'mr-IN', langKey: 'mr', label: 'Marathi (मराठी)' },
  { code: 'bn-IN', langKey: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'gu-IN', langKey: 'gu', label: 'Gujarati (ગુજરાતી)' },
];

const EMOTION_COLORS = {
  fear: '#ef4444', sadness: '#3b82f6', anger: '#f97316', joy: '#22c55e',
  disgust: '#a855f7', surprise: '#eab308', neutral: '#94a3b8'
};

const EMOTION_EMOJIS = {
  fear: '😨', sadness: '😢', anger: '😠', joy: '😊',
  disgust: '🤢', surprise: '😲', neutral: '😐',
  Fearful: '😨', Sad: '😢', Angry: '😠', Calm: '😌',
  Anxious: '😟', Hopeful: '🌟', Neutral: '😐'
};

const SENTIMENT_COLORS = { positive: '#22c55e', neutral: '#eab308', negative: '#ef4444' };

// ─── Distress Dashboard Panel ───────────────────────────
function DistressDashboard({ analysis }) {
  if (!analysis) return null;

  const { distress_score = 0, distress_band = 'Low', sentiment, emotions = [], language_detected, crisis_flag } = analysis;

  const gaugeColor = distress_score >= 75 ? '#ef4444' : distress_score >= 50 ? '#f97316' : distress_score >= 25 ? '#eab308' : '#22c55e';
  const bandLabel = distress_score >= 75 ? 'SEVERE' : distress_score >= 50 ? 'HIGH RISK' : distress_score >= 25 ? 'MODERATE' : 'STABLE';

  return (
    <div style={{
      borderTop: '1px solid #e2e8f0',
      padding: '0.6rem 0.75rem',
      backgroundColor: crisis_flag ? '#fef2f2' : '#f8fafc',
      fontSize: '0.72rem'
    }}>
      {/* Crisis Alert Banner */}
      {crisis_flag && (
        <div style={{
          backgroundColor: '#dc2626', color: '#fff', padding: '4px 8px',
          borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold',
          marginBottom: '6px', textAlign: 'center'
        }}>
          ⚠️ CRISIS DETECTED — Helplines: 112 | 14416 | 181
        </div>
      )}

      {/* Distress Gauge Bar */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <span style={{ fontWeight: '600', color: '#334155' }}>Distress Score</span>
          <span style={{
            backgroundColor: gaugeColor, color: '#fff', padding: '1px 6px',
            borderRadius: '8px', fontWeight: '700', fontSize: '0.68rem'
          }}>
            {Math.round(distress_score)} — {bandLabel}
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, distress_score)}%`, height: '100%',
            backgroundColor: gaugeColor, borderRadius: '4px',
            transition: 'width 0.5s ease, background-color 0.5s ease'
          }} />
        </div>
        {/* Color legend */}
        <div style={{ display: 'flex', gap: '2px', marginTop: '2px', height: '3px' }}>
          <div style={{ flex: 1, backgroundColor: '#22c55e', borderRadius: '2px' }} />
          <div style={{ flex: 1, backgroundColor: '#eab308', borderRadius: '2px' }} />
          <div style={{ flex: 1, backgroundColor: '#f97316', borderRadius: '2px' }} />
          <div style={{ flex: 1, backgroundColor: '#ef4444', borderRadius: '2px' }} />
        </div>
      </div>

      {/* Emotion Bars */}
      {emotions.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <span style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '3px' }}>Emotions</span>
          {emotions.slice(0, 4).map((em, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <span style={{ width: '55px', textTransform: 'capitalize', color: '#475569', fontSize: '0.68rem' }}>
                {EMOTION_EMOJIS[em.label] || '•'} {em.label}
              </span>
              <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round((em.score || 0) * 100)}%`, height: '100%',
                  backgroundColor: EMOTION_COLORS[em.label] || '#94a3b8', borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <span style={{ width: '28px', textAlign: 'right', color: '#64748b', fontSize: '0.65rem' }}>
                {Math.round((em.score || 0) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Info Chips */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {sentiment && (
          <span style={{
            backgroundColor: SENTIMENT_COLORS[sentiment.label] || '#94a3b8', color: '#fff',
            padding: '1px 6px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {sentiment.label} ({Math.round((sentiment.score || 0) * 100)}%)
          </span>
        )}
        {language_detected && (
          <span style={{
            backgroundColor: '#e0f2fe', color: '#0369a1',
            padding: '1px 6px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '600'
          }}>
            🌐 {language_detected.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function FloatingChatboard() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      text: "Namaste! I am AAROHAN AI, your empathetic victim support assistant. How are you feeling today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: 'Calm'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => (language === 'hi' ? 'hi-IN' : 'en-US'));
  const [isListening, setIsListening] = useState(false);
  const [autoTts, setAutoTts] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);

  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (language === 'hi' && selectedLang !== 'hi-IN') {
      setSelectedLang('hi-IN');
    } else if (language === 'en' && selectedLang !== 'en-US') {
      setSelectedLang('en-US');
    }
  }, [language]);

  // Helper for authenticated API calls
  const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(`/api/v1/chatbot${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API Error');
    }
    return data;
  };

  // Fetch sessions & active message history on open
  useEffect(() => {
    if (!isOpen) return;

    const initChat = async () => {
      try {
        const sessRes = await apiFetch('/sessions');
        const sessList = sessRes.data || [];
        setSessions(sessList);

        let sId = activeSessionId;
        if (!sId && sessList.length > 0) {
          sId = sessList[0]._id;
          setActiveSessionId(sId);
        }

        if (sId) {
          const msgRes = await apiFetch(`/sessions/${sId}/messages`);
          if (msgRes.data && msgRes.data.length > 0) {
            const formatted = msgRes.data.map(m => ({
              id: m._id,
              sender: m.senderType === 'victim' ? 'user' : 'bot',
              text: m.content,
              time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              emotion: m.metadata?.emotion || m.metadata?.emotionResponseFor || null,
              sentiment: m.metadata?.sentiment?.label || null,
              crisis: m.metadata?.crisis_flag || false
            }));
            setMessages(formatted);
          }
        }
      } catch (err) {
        console.warn("Floating chat initialization offline/unauthenticated fallback:", err.message);
      }
    };

    initChat();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Setup Web Speech Recognition for Audio Intake (STT)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedLang;

        recognition.onresult = (event) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      } catch (_) {}
    }
  }, [selectedLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Microphone speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = selectedLang;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('STT error:', err);
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech (TTS) Audio Output
  const speakText = (text, msgId = null) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (speakingMsgId === msgId && msgId !== null) {
      setSpeakingMsgId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(selectedLang.split('-')[0]));
    if (langVoice) utterance.voice = langVoice;

    utterance.onstart = () => { if (msgId) setSpeakingMsgId(msgId); };
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const currentLangObj = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    let sId = activeSessionId;
    if (!sId) {
      try {
        const createRes = await apiFetch('/sessions', { method: 'POST' });
        if (createRes.data?._id) {
          sId = createRes.data._id;
          setActiveSessionId(sId);
        }
      } catch (err) {
        console.warn("Session creation fallback:", err);
      }
    }

    try {
      let botText = "";
      let msgEmotion = null;
      let msgSentiment = null;
      let isCrisis = false;

      if (sId) {
        const resData = await apiFetch(`/sessions/${sId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: text.trim(),
            language: currentLangObj.label
          })
        });

        botText = resData.data?.content || "I am here to support you in every step.";

        // Read REAL analysis from backend response
        if (resData.analysis) {
          setLatestAnalysis(resData.analysis);
          msgEmotion = resData.analysis.primary_emotion || null;
          msgSentiment = resData.analysis.sentiment?.label || null;
          isCrisis = resData.analysis.crisis_flag || false;
        }
      } else {
        botText = "I am listening and here to support you. You are not alone, and taking things one moment at a time can help.";
      }

      const botReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: msgEmotion,
        sentiment: msgSentiment,
        crisis: isCrisis
      };

      setMessages((prev) => [...prev, botReply]);

      if (autoTts && botText) {
        speakText(botText, botReply.id);
      }
    } catch (err) {
      console.error("Floating Chat Send error:", err);
      const fallbackReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I am here to support you. Please take a deep breath and share how you feel.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, fontFamily: 'sans-serif' }}>
      {/* Floating Toggle Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.4), 0 8px 10px -6px rgba(30, 58, 138, 0.2)',
            border: '2px solid #3b82f6',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'transform 0.2s ease, background-color 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="Open AAROHAN Empathetic Support Chatboard"
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            color: '#1e3a8a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.95rem',
            fontWeight: 'bold'
          }}>
            💬
          </div>
          <span>AAROHAN AI Support Assistant</span>
        </button>
      )}

      {/* Expanded Floating Chat Widget Panel */}
      {isOpen && (
        <div
          style={{
            width: '420px',
            height: '620px',
            maxHeight: '90vh',
            maxWidth: '92vw',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            padding: '0.7rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>AAROHAN AI Chatboard</h3>
                <span style={{ fontSize: '0.65rem', color: '#93c5fd', display: 'block' }}>Empathetic Support &amp; Consoling</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {/* Language Selector */}
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  padding: '2px 4px',
                  fontSize: '0.68rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} style={{ color: '#000' }}>
                    {l.label}
                  </option>
                ))}
              </select>

              {/* Dashboard Toggle */}
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                style={{
                  background: showDashboard ? 'rgba(255,255,255,0.25)' : 'none',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff', borderRadius: '4px',
                  fontSize: '0.75rem', cursor: 'pointer', padding: '2px 5px'
                }}
                title={showDashboard ? 'Hide analysis panel' : 'Show analysis panel'}
              >
                📊
              </button>

              {/* TTS Toggle */}
              <button
                onClick={() => setAutoTts(!autoTts)}
                style={{
                  background: autoTts ? 'rgba(255,255,255,0.25)' : 'none',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff', borderRadius: '4px',
                  fontSize: '0.75rem', cursor: 'pointer', padding: '2px 5px'
                }}
                title={autoTts ? 'Auto-speak ON' : 'Auto-speak OFF'}
              >
                {autoTts ? '🔊' : '🔇'}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '0 4px',
                  lineHeight: '1'
                }}
                title="Close chatboard"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            padding: '0.75rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            backgroundColor: '#f8fafc'
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: m.sender === 'user' ? '#1e3a8a' : (m.crisis ? '#fef2f2' : '#ffffff'),
                  color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: m.sender === 'bot' ? (m.crisis ? '1px solid #fca5a5' : '1px solid #e2e8f0') : 'none',
                  fontSize: '0.82rem',
                  lineHeight: '1.45',
                  whiteSpace: 'pre-wrap'
                }}>
                  <p style={{ margin: 0 }}>{m.text}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '3px', fontSize: '0.65rem', color: '#64748b' }}>
                  <span>{m.time} {m.sender === 'user' ? '(You)' : '(AAROHAN AI)'}</span>

                  {/* Sentiment Badge */}
                  {m.sentiment && (
                    <span style={{
                      backgroundColor: SENTIMENT_COLORS[m.sentiment] || '#94a3b8',
                      color: '#fff', padding: '1px 5px', borderRadius: '8px',
                      fontSize: '0.62rem', fontWeight: '600', textTransform: 'capitalize'
                    }}>
                      {m.sentiment}
                    </span>
                  )}

                  {/* Emotion Badge */}
                  {m.emotion && (
                    <span style={{
                      backgroundColor: '#e0f2fe', color: '#0369a1',
                      padding: '1px 5px', borderRadius: '8px',
                      fontSize: '0.62rem', fontWeight: '600', textTransform: 'capitalize'
                    }}>
                      {EMOTION_EMOJIS[m.emotion] || '•'} {m.emotion}
                    </span>
                  )}

                  {/* Crisis Badge */}
                  {m.crisis && (
                    <span style={{
                      backgroundColor: '#dc2626', color: '#fff',
                      padding: '1px 5px', borderRadius: '8px',
                      fontSize: '0.62rem', fontWeight: '700'
                    }}>
                      ⚠️ CRISIS
                    </span>
                  )}

                  {/* TTS button */}
                  {m.sender === 'bot' && (
                    <button
                      onClick={() => speakText(m.text, m.id)}
                      style={{ background: 'none', border: 'none', color: speakingMsgId === m.id ? '#16a34a' : '#475569', cursor: 'pointer', fontSize: '0.72rem', padding: 0 }}
                      title="Listen audio response"
                    >
                      {speakingMsgId === m.id ? '⏹️' : '🔊'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '0.5rem 0.85rem', borderRadius: '12px', fontSize: '0.78rem', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  <span style={{ animation: 'pulse 1.5s infinite' }}>AAROHAN AI is analyzing &amp; responding...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Listening Prompt Banner */}
          {isListening && (
            <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '0.75rem', padding: '4px 10px', borderTop: '1px solid #fca5a5', textAlign: 'center', fontWeight: '600' }}>
              🔴 Listening in {LANGUAGES.find(l => l.code === selectedLang)?.label}... Speak into microphone.
            </div>
          )}

          {/* Footer Input Controls */}
          <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              onClick={toggleListening}
              style={{
                backgroundColor: isListening ? '#ef4444' : '#f1f5f9',
                color: isListening ? '#ffffff' : '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.95rem',
                flexShrink: 0
              }}
              title={isListening ? 'Stop Recording' : 'Voice Input (Microphone)'}
              type="button"
            >
              🎙️
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Type or speak in ${LANGUAGES.find(l => l.code === selectedLang)?.label || 'your language'}...`}
              disabled={loading}
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '0.45rem 0.8rem',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                fontSize: '0.85rem',
                flexShrink: 0
              }}
              type="button"
            >
              ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
