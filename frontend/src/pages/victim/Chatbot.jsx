import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, LanguageToggle } from '../../context/LanguageContext';
import './Chatbot.css';

const LANGUAGES = [
  { code: 'en-US', langKey: 'en', label: 'English (अंग्रेज़ी)' },
  { code: 'hi-IN', langKey: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'te-IN', langKey: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'ta-IN', langKey: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'kn-IN', langKey: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml-IN', langKey: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'mr-IN', langKey: 'mr', label: 'Marathi (मराठी)' },
  { code: 'bn-IN', langKey: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'gu-IN', langKey: 'gu', label: 'Gujarati (ગુજરાતી)' },
];

const EMOTION_ICONS = {
  Fearful: '😨 Fearful',
  Anxious: '😟 Anxious',
  Sad: '😢 Sad',
  Angry: '😠 Angry',
  Calm: '😌 Calm',
  Hopeful: '🌟 Hopeful',
  Neutral: '😐 Neutral'
};

export default function Chatbot() {
  const { language, setLanguage, t, langCode } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemError, setSystemError] = useState('');
  
  // Multilingual & Audio State
  const [selectedLang, setSelectedLang] = useState(() => (language === 'hi' ? 'hi-IN' : 'en-US'));
  const [isListening, setIsListening] = useState(false);
  const [autoTts, setAutoTts] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [speechNotice, setSpeechNotice] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechNoticeTimerRef = useRef(null);

  // Synchronize with global language
  useEffect(() => {
    if (language === 'hi' && selectedLang !== 'hi-IN') {
      setSelectedLang('hi-IN');
    } else if (language === 'en' && selectedLang !== 'en-US') {
      setSelectedLang('en-US');
    }
  }, [language]);

  const handleLangSelect = (code) => {
    setSelectedLang(code);
    if (code.startsWith('hi')) {
      setLanguage('hi');
    } else if (code.startsWith('en')) {
      setLanguage('en');
    }
  };

  // Helper to show dismissible speech notice
  const showSpeechNotice = (msg) => {
    setSpeechNotice(msg);
    if (speechNoticeTimerRef.current) clearTimeout(speechNoticeTimerRef.current);
    speechNoticeTimerRef.current = setTimeout(() => {
      setSpeechNotice('');
    }, 6000);
  };

  // Helper to fetch with auth
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

  // Setup Web Speech Recognition for Audio Intake (STT) with robust error handling
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
            setInputValue((prev) => (prev ? prev + ' ' + transcript : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = (event) => {
          // Graceful handling of network, no-speech, and permission errors
          setIsListening(false);
          const err = event.error;

          if (err === 'network') {
            showSpeechNotice(t('speechNetError'));
          } else if (err === 'no-speech') {
            showSpeechNotice(t('speechNoSpeech'));
          } else if (err === 'not-allowed' || err === 'service-not-allowed') {
            showSpeechNotice(t('speechMicBlocked'));
          } else if (err !== 'aborted') {
            showSpeechNotice(`Voice input status: ${err}. You can type your message below.`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization notice:', e);
      }
    }

    return () => {
      if (speechNoticeTimerRef.current) clearTimeout(speechNoticeTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [selectedLang, language]);

  // Handle Speech-to-Text Toggle
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showSpeechNotice(language === 'hi' 
        ? 'इस ब्राउज़र में वाणी पहचान समर्थित नहीं है। आप नीचे टाइप कर सकते हैं।' 
        : 'Speech recognition is not supported in this browser. You can type your message below.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
    } else {
      try {
        if (!recognitionRef.current) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognitionRef.current = recognition;
        }
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        setIsListening(true);
        setSpeechNotice('');
      } catch (err) {
        setIsListening(false);
        if (err.name !== 'InvalidStateError') {
          showSpeechNotice(t('speechNetError'));
        }
      }
    }
  };

  // Text-to-Speech (TTS) Audio Output
  const speakText = (text, msgId = null) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel(); // Stop ongoing speech

    if (speakingMsgId === msgId && msgId !== null) {
      setSpeakingMsgId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;
    utterance.rate = 0.95;

    // Try to match voice for selected language if available
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(selectedLang.split('-')[0]));
    if (langVoice) {
      utterance.voice = langVoice;
    }

    utterance.onstart = () => {
      if (msgId) setSpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // 1. Fetch Sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await apiFetch('/sessions');
        setSessions(data.data || []);
        if (data.data?.length > 0) {
          setActiveSessionId(data.data[0]._id);
        }
      } catch (err) {
        setSystemError('Failed to connect to backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // 2. Fetch Messages when activeSessionId changes
  useEffect(() => {
    if (!activeSessionId) return;
    const fetchMessages = async () => {
      try {
        const data = await apiFetch(`/sessions/${activeSessionId}/messages`);
        const formatted = (data.data || []).map(m => ({
          id: m._id,
          role: m.senderType === 'victim' ? 'user' : 'system',
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: m.senderType === 'system' && m.isFlagged,
          emotion: m.metadata?.emotion || null,
          sentiment: m.metadata?.sentiment?.label || null,
          crisis: m.metadata?.crisis_flag || false
        }));
        setMessages(formatted);
      } catch (err) {
        setSystemError('Failed to load messages.');
      }
    };
    fetchMessages();
  }, [activeSessionId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/sessions', { method: 'POST' });
      setSessions([data.data, ...sessions]);
      setActiveSessionId(data.data._id);
    } catch (err) {
      setSystemError('Failed to create new conversation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (feeling) => {
    try {
      await apiFetch('/checkin', {
        method: 'POST',
        body: JSON.stringify({ feeling })
      });
      alert(language === 'hi' ? 'दैनिक चेक-इन सफलतापूर्वक दर्ज किया गया।' : 'Check-in submitted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to submit check-in.');
    }
  };

  const handleRequestCounselor = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/victim/request-support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(language === 'hi' ? 'परामर्शदाता सहायता का अनुरोध दर्ज किया गया है।' : 'Counselor support requested successfully.');
    } catch (err) {
      alert(err.message || 'Failed to request counselor support.');
    }
  };

  const handleArchive = async () => {
    if (!activeSessionId) return;
    const confirmMsg = language === 'hi' ? 'क्या आप इस बातचीत को हटाना चाहते हैं?' : 'Are you sure you want to archive this conversation?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await apiFetch(`/sessions/${activeSessionId}`, { method: 'DELETE' });
      const updatedSessions = sessions.filter(s => s._id !== activeSessionId);
      setSessions(updatedSessions);
      setActiveSessionId(updatedSessions.length > 0 ? updatedSessions[0]._id : null);
      if (updatedSessions.length === 0) setMessages([]);
    } catch (err) {
      alert('Failed to archive conversation.');
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    let currentSessionId = activeSessionId;
    
    if (!currentSessionId) {
      try {
        const data = await apiFetch('/sessions', { method: 'POST' });
        currentSessionId = data.data._id;
        setSessions([data.data, ...sessions]);
        setActiveSessionId(currentSessionId);
      } catch (err) {
        setSystemError('Failed to start conversation.');
        return;
      }
    }

    const currentLangObj = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

    const userMsgObj = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setInputValue('');
    setIsTyping(true);
    setSystemError('');

    try {
      const responseData = await apiFetch(`/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: trimmedInput,
          language: currentLangObj.label
        })
      });
      
      const aiData = responseData.data;

      // Read REAL analysis from backend Gemini response
      let msgEmotion = null;
      let msgSentiment = null;
      let isCrisis = false;

      if (responseData.analysis) {
        setLatestAnalysis(responseData.analysis);
        msgEmotion = responseData.analysis.primary_emotion || null;
        msgSentiment = responseData.analysis.sentiment?.label || null;
        isCrisis = responseData.analysis.crisis_flag || false;
      }

      const aiMsgObj = {
        id: aiData._id || Date.now().toString(),
        role: 'system',
        content: aiData.content,
        timestamp: new Date(aiData.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: aiData.isFlagged,
        emotion: msgEmotion,
        sentiment: msgSentiment,
        crisis: isCrisis
      };

      setMessages((prev) => [...prev, aiMsgObj]);

      // Auto-TTS Response Speech if enabled
      if (autoTts && aiData.content) {
        speakText(aiData.content, aiMsgObj.id);
      }
      
      if (messages.length === 0) {
        const updatedSessions = sessions.map(s => {
          if (s._id === currentSessionId) {
            return { ...s, title: trimmedInput.substring(0, 30) };
          }
          return s;
        });
        setSessions(updatedSessions);
      }

    } catch (err) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: err.message || (language === 'hi' ? 'सहायक से जुड़ने में त्रुटि हुई।' : 'An error occurred while connecting to the assistant.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading && !activeSessionId && sessions.length === 0) {
    return <div className="loading-state">{language === 'hi' ? 'सहायक लोड हो रहा है...' : 'Loading victim support assistant...'}</div>;
  }

  return (
    <div className="chatbot-container">
      {/* 1. TOP HEADER WITH MULTILINGUAL CONTROLS */}
      <div className="chatbot-top-header">
        <div className="chatbot-header-left">
          <img src="/images/emblem.png" alt="Govt Emblem" className="chatbot-header-logo" />
          <div>
            <h1>{t('chatbotTitle')}</h1>
            <span className="chatbot-subtitle">{t('chatbotSubtitle')}</span>
          </div>
        </div>

        <div className="chatbot-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Quick Dual Language Toggle */}
          <LanguageToggle />

          {/* Detailed Language Selector Dropdown */}
          <div className="lang-selector-wrapper">
            <span className="lang-label">🌐</span>
            <select
              className="lang-select-dropdown"
              value={selectedLang}
              onChange={(e) => handleLangSelect(e.target.value)}
              title="Select Speech & Chat Language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-TTS Speech Toggle */}
          <button
            className={`btn-action-pill ${autoTts ? 'active' : ''}`}
            onClick={() => setAutoTts(!autoTts)}
            title="Toggle automatic audio response reading"
          >
            {autoTts ? t('audioResponseOn') : t('audioResponseOff')}
          </button>

          <Link to="/victim/dashboard" className="chatbot-back-link">{t('dashboardBack')}</Link>
        </div>
      </div>

      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <button className="btn-new-chat" onClick={handleCreateSession}>{t('newConversation')}</button>
          <div className="sessions-list">
            {sessions.map(s => (
              <div 
                key={s._id} 
                className={`session-item ${activeSessionId === s._id ? 'active' : ''}`}
                onClick={() => setActiveSessionId(s._id)}
              >
                {s.title || (language === 'hi' ? 'बातचीत' : 'Conversation')}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="chat-interface">
          <div className="chat-header">
            <div className="chat-status">
              <span className={`status-dot ${systemError ? 'offline' : 'online'}`} aria-hidden="true"></span>
              <span className="status-text">
                {systemError 
                  ? (language === 'hi' ? 'सहायक ऑफ़लाइन' : 'Assistant Offline') 
                  : (language === 'hi' ? 'सहायक ऑनलाइन एवं सहानुभूतिपूर्ण श्रोता' : 'Assistant Online & Empathetic Listener')}
              </span>
            </div>
            <div className="chat-actions">
              <button className="btn-action" onClick={() => handleCheckIn('Okay')}>
                {language === 'hi' ? 'चेक-इन' : 'Check-In'}
              </button>
              <button className="btn-action" onClick={handleRequestCounselor}>
                {language === 'hi' ? 'परामर्शदाता अनुरोध' : 'Request Counselor'}
              </button>
              {activeSessionId && (
                <button className="btn-action btn-danger" onClick={handleArchive}>
                  {language === 'hi' ? 'हटाएं' : 'Archive'}
                </button>
              )}
            </div>
          </div>

          {/* Speech / Network Error Notice Banner */}
          {speechNotice && (
            <div 
              style={{
                background: '#fff8e6',
                border: '1px solid #fde047',
                color: '#92400e',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                margin: '0.75rem 1rem 0 1rem',
                fontSize: '0.84rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                animation: 'fadeIn 0.2s ease-in'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💡</span>
                <span>{speechNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechNotice('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#92400e',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0 0.25rem'
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div className="chat-messages-area" aria-live="polite">
            {messages.length === 0 && !isTyping ? (
              <div className="chat-empty-state">
                <div className="empty-logo-wrapper">
                  <img src="/images/bot-logo.png" alt="Bot Logo" className="chat-bot-logo" />
                </div>
                <p className="empty-main-text">
                  {language === 'hi' ? 'आरोहण सहानुभूतिपूर्ण सहायता में आपका स्वागत है' : 'Welcome to AAROHAN Empathetic Support'}
                </p>
                <p className="empty-subtext">
                  {language === 'hi' 
                    ? 'आप अपनी पसंद की भाषा (हिंदी या अंग्रेज़ी) में टाइप कर सकते हैं या माइक से बोल सकते हैं।' 
                    : 'You can type or speak into your microphone in English or Hindi.'}
                </p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message-wrapper ${msg.role === 'user' ? 'message-user' : 'message-system'} ${msg.isError ? 'message-error' : ''}`}
                  >
                    <div className="message-content">
                      {msg.content}
                    </div>

                    <div className="message-meta-row">
                      <span className="message-timestamp">
                        {msg.timestamp} {msg.role === 'user' ? (language === 'hi' ? '(आप)' : '(You)') : '(AAROHAN AI)'}
                      </span>

                      {/* Sentiment Badge */}
                      {msg.sentiment && (
                        <span className={`emotion-badge sentiment-${msg.sentiment}`} style={{
                          backgroundColor: msg.sentiment === 'negative' ? '#fecaca' : msg.sentiment === 'positive' ? '#bbf7d0' : '#fef3c7',
                          color: msg.sentiment === 'negative' ? '#991b1b' : msg.sentiment === 'positive' ? '#166534' : '#92400e',
                          textTransform: 'capitalize'
                        }}>
                          {msg.sentiment}
                        </span>
                      )}

                      {/* Emotion Tag */}
                      {msg.emotion && (
                        <span className="emotion-badge">{EMOTION_ICONS[msg.emotion] || msg.emotion}</span>
                      )}

                      {/* Crisis Badge */}
                      {msg.crisis && (
                        <span className="emotion-badge" style={{ backgroundColor: '#fecaca', color: '#991b1b', fontWeight: '700' }}>
                          ⚠️ {language === 'hi' ? 'संकट चेतावनी' : 'CRISIS'}
                        </span>
                      )}

                      {/* Audio Playback Button (TTS) */}
                      {msg.role !== 'user' && (
                        <button
                          className={`btn-tts-speaker ${speakingMsgId === msg.id ? 'speaking' : ''}`}
                          onClick={() => speakText(msg.content, msg.id)}
                          title="Listen to response audio"
                        >
                          {speakingMsgId === msg.id 
                            ? (language === 'hi' ? '⏹️ रोकें' : '⏹️ Stop') 
                            : (language === 'hi' ? '🔊 सुनें' : '🔊 Listen Audio')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message-wrapper message-system">
                    <div className="message-content typing-indicator" aria-label="Assistant is analyzing and typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Voice Input Prompt when listening */}
          {isListening && (
            <div className="listening-banner">
              <span className="listening-pulse">🔴</span> {t('listening')}
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-area">
            {/* Microphone Button (Audio Intake STT) */}
            <button
              className={`btn-mic ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? t('stopMicTitle') : t('speakMicTitle')}
              type="button"
            >
              🎙️
            </button>

            <label htmlFor="chatInput" className="sr-only">{t('typeMessagePlaceholder')}</label>
            <textarea
              id="chatInput"
              ref={inputRef}
              className="chat-input"
              placeholder={t('typeMessagePlaceholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              rows={1}
            />

            <button 
              className="btn-send"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              {t('send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
