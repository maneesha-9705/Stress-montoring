import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const TRANSLATIONS = {
  en: {
    // Brand & Header
    govTitle: 'Government of India |',
    govSubtitle: 'National Crime Records Bureau',
    portalTitle: 'AAROHAN (Counselor Portal)',
    victimPortalTitle: 'AAROHAN (Victim Portal)',
    loggedInAs: 'Logged in as:',
    logout: 'Logout',
    language: 'Language',
    english: 'English',
    hindi: 'हिंदी (Hindi)',

    // Navigation
    navDashboard: 'Dashboard',
    navRequests: 'Consultation Requests',
    navAppointments: 'Appointments',
    navMyVictims: 'My Victims',
    navFollowUps: 'Follow-Ups',
    navNotifications: 'Notifications',
    navProfile: 'Profile',

    // Counselor - My Victims
    myVictimsTitle: 'My Assigned Victims',
    myVictimsSubtitle: 'Your active caseload',
    totalAssigned: 'Total Assigned',
    searchPlaceholder: 'Search by name, case ID, district...',
    filterLabel: 'Filter:',
    filterAll: 'ALL',
    filterHighRisk: 'HIGH RISK',
    filterModerateRisk: 'MODERATE RISK',
    filterLowRisk: 'LOW RISK',
    caseId: 'Case ID:',
    lastInteraction: 'Last Interaction:',
    location: 'Location:',
    contact: 'Contact:',
    supportType: 'Support Type:',
    viewProfile: 'View Profile →',
    noVictimsFound: 'No assigned victims found',
    noVictimsDesc: 'No victims matched your search/filter criteria.',

    // Counselor - Follow-Ups
    followUpTitle: 'FOLLOW-UP TRACKING & MONITORING',
    victimSelector: 'Victim:',
    caseLabel: 'Case:',
    lastUpdated: 'Last updated:',
    autoRefresh: 'Auto-refresh: 60s',
    distressTrendTitle: '📈 Distress Trend Tracking (30 Days)',
    followUpStatusTitle: '📋 Follow-Up Status',
    nextFollowUpDue: 'Next Follow-Up Due',
    lastContactedDate: 'Last Contacted Date',
    followUpMethod: 'Follow-Up Method',
    notes: 'Notes:',
    viewFullProfile: 'View Full Mental Health Profile →',
    todayEmotionTitle: "Today's Emotion & Check-In",
    allFollowUpsTitle: 'ALL ASSIGNED FOLLOW-UP SCHEDULES',
    filterFollowUps: 'Filter follow-up list...',
    victimNameTh: 'Victim Name',
    caseIdTh: 'Case ID',
    riskLevelTh: 'Risk Level',
    nextDueTh: 'Next Follow-Up Due',
    methodTh: 'Method',
    statusTh: 'Status',
    actionTh: 'Action',
    scheduled: 'Scheduled',
    completed: 'Completed',
    overdue: 'Overdue',
    overdueAlertTitle: 'FOLLOW-UP OVERDUE',
    overdueAlertMsg: 'A follow-up session is overdue. Please initiate contact immediately to evaluate safety and distress levels.',
    crisisAlertTitle: 'CRISIS SIGNAL DETECTED SINCE LAST CHECK-IN',
    crisisAlertMsg: 'Chatbot monitoring recorded elevated distress or crisis markers for this victim. Immediate counselor follow-up is recommended.',

    // Chatbot
    chatbotTitle: 'Govt. Victim Support Assistant (AAROHAN)',
    chatbotSubtitle: 'Empathetic AI Support & Emotion Analysis Portal',
    audioResponseOn: '🔊 Audio Response: ON',
    audioResponseOff: '🔇 Audio Response: OFF',
    dashboardBack: '← Dashboard',
    newConversation: '+ New Conversation',
    typeMessagePlaceholder: 'Type your message here (or tap mic to speak in English/Hindi)...',
    listening: 'Listening... (Speak in English or Hindi)',
    speakMicTitle: 'Tap to speak',
    stopMicTitle: 'Stop listening',
    send: 'Send',
    clearChat: 'Clear',
    requestCounselor: 'Request Counselor Call',
    checkinPrompt: 'How are you feeling right now?',
    speechNetError: 'Speech recognition network error: Voice-to-text service is currently unavailable. You can type your message in English or Hindi below.',
    speechNoSpeech: 'No speech was detected. Please try tapping the mic again and speaking clearly.',
    speechMicBlocked: 'Microphone access is blocked. Please allow microphone permissions in your browser to speak.',
  },
  hi: {
    // Brand & Header
    govTitle: 'भारत सरकार |',
    govSubtitle: 'राष्ट्रीय अपराध रिकॉर्ड ब्यूरो (NCRB)',
    portalTitle: 'आरोहण (परामर्शदाता पोर्टल)',
    victimPortalTitle: 'आरोहण (पीड़ित सहायता पोर्टल)',
    loggedInAs: 'लॉग इन:',
    logout: 'लॉग आउट',
    language: 'भाषा',
    english: 'English',
    hindi: 'हिंदी',

    // Navigation
    navDashboard: 'डैशबोर्ड',
    navRequests: 'परामर्श अनुरोध',
    navAppointments: 'अपॉइंटमेंट्स',
    navMyVictims: 'मेरे पीड़ित',
    navFollowUps: 'फॉलो-अप्स',
    navNotifications: 'सूचनाएं',
    navProfile: 'प्रोफ़ाइल',

    // Counselor - My Victims
    myVictimsTitle: 'मेरे सौंपे गए पीड़ित',
    myVictimsSubtitle: 'आपका सक्रिय केसलोड',
    totalAssigned: 'कुल सौंपे गए',
    searchPlaceholder: 'नाम, केस आईडी, जिले से खोजें...',
    filterLabel: 'फ़िल्टर:',
    filterAll: 'सभी',
    filterHighRisk: 'उच्च जोखिम',
    filterModerateRisk: 'मध्यम जोखिम',
    filterLowRisk: 'कम जोखिम',
    caseId: 'केस आईडी:',
    lastInteraction: 'अंतिम बातचीत:',
    location: 'स्थान:',
    contact: 'संपर्क:',
    supportType: 'सहायता प्रकार:',
    viewProfile: 'प्रोफ़ाइल देखें →',
    noVictimsFound: 'कोई सौंपा गया पीड़ित नहीं मिला',
    noVictimsDesc: 'आपके खोज/फ़िल्टर मानदंडों से कोई पीड़ित मेल नहीं खाता।',

    // Counselor - Follow-Ups
    followUpTitle: 'फॉलो-अप ट्रैकिंग एवं निगरानी',
    victimSelector: 'पीड़ित:',
    caseLabel: 'केस:',
    lastUpdated: 'अंतिम अपडेट:',
    autoRefresh: 'स्वतः ताज़ा: 60s',
    distressTrendTitle: '📈 संकट प्रवृत्ति ट्रैकिंग (30 दिन)',
    followUpStatusTitle: '📋 फॉलो-अप स्थिति',
    nextFollowUpDue: 'अगला फॉलो-अप देय',
    lastContactedDate: 'अंतिम संपर्क तिथि',
    followUpMethod: 'फॉलो-अप माध्यम',
    notes: 'टिप्पणी:',
    viewFullProfile: 'पूर्ण मानसिक स्वास्थ्य प्रोफ़ाइल देखें →',
    todayEmotionTitle: 'आज की भावना एवं चेक-इन',
    allFollowUpsTitle: 'सभी सौंपे गए फॉलो-अप कार्यक्रम',
    filterFollowUps: 'फॉलो-अप सूची फ़िल्टर करें...',
    victimNameTh: 'पीड़ित का नाम',
    caseIdTh: 'केस आईडी',
    riskLevelTh: 'जोखिम स्तर',
    nextDueTh: 'अगला फॉलो-अप',
    methodTh: 'माध्यम',
    statusTh: 'स्थिति',
    actionTh: 'कार्रवाई',
    scheduled: 'अनुसूचित',
    completed: 'पूर्ण',
    overdue: 'अतिदेय',
    overdueAlertTitle: 'फॉलो-अप अतिदेय (विलंबित)',
    overdueAlertMsg: 'एक फॉलो-अप सत्र विलंबित है। कृपया सुरक्षा और संकट के स्तर का मूल्यांकन करने के लिए तुरंत संपर्क शुरू करें।',
    crisisAlertTitle: 'अंतिम चेक-इन के बाद संकट संकेत दर्ज',
    crisisAlertMsg: 'चैटबॉट निगरानी ने इस पीड़ित के लिए बढ़े हुए संकट संकेत दर्ज किए हैं। तत्काल परामर्शदाता फॉलो-अप की सिफारिश की जाती है।',

    // Chatbot
    chatbotTitle: 'सरकारी पीड़ित सहायता सहायक (आरोहण)',
    chatbotSubtitle: 'सहानुभूतिपूर्ण एआई सहायता एवं भावना विश्लेषण पोर्टल',
    audioResponseOn: '🔊 ऑडियो उत्तर: चालू',
    audioResponseOff: '🔇 ऑडियो उत्तर: बंद',
    dashboardBack: '← डैशबोर्ड',
    newConversation: '+ नई बातचीत',
    typeMessagePlaceholder: 'अपना संदेश यहाँ टाइप करें (या हिंदी/अंग्रेजी में बोलने के लिए माइक दबाएं)...',
    listening: 'सुन रहे हैं... (हिंदी या अंग्रेजी में बोलें)',
    speakMicTitle: 'बोलने के लिए दबाएं',
    stopMicTitle: 'सुनना बंद करें',
    send: 'भेजें',
    clearChat: 'हटाएं',
    requestCounselor: 'परामर्शदाता सहायता का अनुरोध करें',
    checkinPrompt: 'आप अभी कैसा महसूस कर रहे हैं?',
    speechNetError: 'वाणी पहचान नेटवर्क त्रुटि: वॉयस-टू-टेक्स्ट सेवा वर्तमान में आपके नेटवर्क पर उपलब्ध नहीं है। आप नीचे हिंदी या अंग्रेजी में संदेश टाइप कर सकते हैं।',
    speechNoSpeech: 'कोई वाणी नहीं सुनाई दी। कृपया माइक को पुनः दबाकर स्पष्ट बोलें।',
    speechMicBlocked: 'माइक्रोफ़ोन पहुंच अवरुद्ध है। कृपया अपने ब्राउज़र में माइक्रोफ़ोन की अनुमति दें।',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('appLanguage') || 'en';
  });

  const setLanguage = (lang) => {
    const validLang = lang === 'hi' ? 'hi' : 'en';
    setLanguageState(validLang);
    localStorage.setItem('appLanguage', validLang);
  };

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en?.[key] || key;
  };

  const langCode = language === 'hi' ? 'hi-IN' : 'en-US';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, langCode, isHindi: language === 'hi' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key) => TRANSLATIONS.en[key] || key,
      langCode: 'en-US',
      isHindi: false,
    };
  }
  return context;
};

/**
 * LanguageToggle — Sleek bilingual switch button for top navbars and headers
 */
export function LanguageToggle({ style = {} }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#f1f5f9',
        border: '1px solid #cbd5e1',
        borderRadius: '20px',
        padding: '2px',
        fontSize: '0.78rem',
        fontWeight: 700,
        cursor: 'pointer',
        userSelect: 'none',
        ...style,
      }}
      title="Switch Language / भाषा बदलें"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        style={{
          background: language === 'en' ? '#2563eb' : 'transparent',
          color: language === 'en' ? '#ffffff' : '#475569',
          border: 'none',
          borderRadius: '16px',
          padding: '0.25rem 0.65rem',
          fontSize: '0.76rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        style={{
          background: language === 'hi' ? '#2563eb' : 'transparent',
          color: language === 'hi' ? '#ffffff' : '#475569',
          border: 'none',
          borderRadius: '16px',
          padding: '0.25rem 0.65rem',
          fontSize: '0.76rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        हिंदी
      </button>
    </div>
  );
}

export default LanguageContext;
