const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const EmotionAnalysis = require('../models/EmotionAnalysis');
const Alert = require('../models/Alert');
const Case = require('../models/Case');
const Counselor = require('../models/Counselor');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const aiService = require('./aiService');

/**
 * Language code resolver — maps frontend dropdown labels to ISO codes
 */
const LANG_MAP = {
  'English': 'en', 'Telugu (తెలుగు)': 'te', 'Hindi (हिंदी)': 'hi',
  'Tamil (தமிழ்)': 'ta', 'Kannada (ಕನ್ನಡ)': 'kn', 'Malayalam (മലയാളം)': 'ml',
  'Spanish (Español)': 'es', 'French (Français)': 'fr',
  'Marathi (मराठी)': 'mr', 'Bengali (বাংলা)': 'bn', 'Gujarati (ગુજરાતી)': 'gu',
};

const resolveLangCode = (lang) => LANG_MAP[lang] || lang || 'en';

/**
 * Map emotion labels to EmotionAnalysis schema keys
 */
const EMOTION_LABEL_MAP = {
  'fear': 'Fearful', 'sadness': 'Sad', 'anger': 'Angry',
  'joy': 'Calm', 'disgust': 'Angry', 'surprise': 'Anxious',
  'neutral': 'Neutral', 'calm': 'Calm', 'anxiety': 'Anxious',
  // Direct mappings
  'Fearful': 'Fearful', 'Sad': 'Sad', 'Angry': 'Angry',
  'Calm': 'Calm', 'Anxious': 'Anxious', 'Hopeful': 'Hopeful', 'Neutral': 'Neutral'
};

const mapEmotion = (label) => EMOTION_LABEL_MAP[label] || 'Neutral';

/**
 * Independent Crisis Escalation Handler
 * Creates Alert, notifies Counselor, and logs audit record in parallel
 */
const triggerCrisisEscalation = async (victimId, content, langCode, distressScore) => {
  try {
    // 1. Find active case for this victim
    const activeCase = await Case.findOne({
      victimId,
      status: { $in: ['open', 'in-progress', 'assigned', 'resolved', 'pending'] }
    }).sort({ createdAt: -1 });

    const victimUser = await User.findById(victimId).select('name email phone state district');

    // 2. Create CRITICAL Alert
    const alert = await Alert.create({
      caseId: activeCase ? activeCase._id : undefined,
      victimId,
      severity: 'CRITICAL',
      alertType: 'CRISIS_SIGNAL',
      description: `Immediate Crisis Signal: "${content.substring(0, 150)}${content.length > 150 ? '...' : ''}"`
    });

    console.log(`[chatbotService] 🚨 CRITICAL Alert created: ID ${alert._id}`);

    // 3. Notify assigned counselor
    let counselorNotified = false;
    if (activeCase && activeCase.assignedCounselorId) {
      const counselor = await Counselor.findById(activeCase.assignedCounselorId);
      if (counselor && counselor.userId) {
        await Notification.create({
          recipientId: counselor.userId,
          senderId: victimId,
          type: 'CRISIS_ALERT',
          message: `🚨 URGENT: Crisis signal detected for victim ${victimUser?.name || 'Case #' + (activeCase.caseId || activeCase._id)}: "${content.substring(0, 100)}..."`
        });
        counselorNotified = true;
        console.log(`[chatbotService] 🔔 Counselor notified: ${counselor.userId}`);
      }
    }

    // If no assigned counselor, notify state admin
    if (!counselorNotified && victimUser?.state) {
      const stateAdmin = await User.findOne({ role: 'admin', state: victimUser.state });
      if (stateAdmin) {
        await Notification.create({
          recipientId: stateAdmin._id,
          senderId: victimId,
          type: 'CRISIS_ALERT',
          message: `🚨 URGENT: Crisis signal detected for unassigned victim in ${victimUser.state}: "${content.substring(0, 100)}..."`
        });
        console.log(`[chatbotService] 🔔 State Admin notified: ${stateAdmin._id}`);
      }
    }

    // 4. Create Audit Log entry
    await AuditLog.create({
      actorId: victimId,
      actorRole: 'victim',
      action: 'CRISIS_SIGNAL_FLAGGED',
      targetType: 'ChatMessage',
      caseId: activeCase?.caseId || 'N/A',
      metadata: {
        messageSnippet: content.substring(0, 200),
        detectedLanguage: langCode,
        distressScore,
        alertId: alert._id,
        timestamp: new Date()
      }
    }).catch(err => console.warn('[chatbotService] Audit log skipped:', err.message));

  } catch (escalationErr) {
    console.error('[chatbotService] Escalation handler error:', escalationErr.message);
  }
};

/**
 * Process a victim's chat message — full pipeline:
 * 1. Keyword & Urgency crisis check (instant)
 * 2. LLM unified analysis (or smart fallback)
 * 3. Dual crisis check & parallel counselor escalation
 * 4. Save real data to ChatMessage + EmotionAnalysis
 * 5. Return structured result
 */
const processVictimMessage = async (sessionId, victimId, content, language = 'English') => {
  // 1. Verify session exists and belongs to the victim
  const session = await ChatSession.findOne({ _id: sessionId, victimId, status: 'active' });
  if (!session) {
    const error = new Error('Session not found or not active');
    error.status = 404;
    throw error;
  }

  const langCode = resolveLangCode(language);

  // 2. Run keyword crisis check FIRST (instant, no API needed)
  const keywordCrisis = aiService.getKeywordCrisisFlag(content);
  const urgencyFlag = aiService.getUrgencyFlag(content);

  // 3. Get conversation history for context
  const contextLimit = parseInt(process.env.CHAT_CONTEXT_MESSAGES) || 15;
  const previousMessages = await ChatMessage.find({ sessionId: session._id })
    .sort({ createdAt: -1 })
    .limit(contextLimit);
  previousMessages.reverse();

  const conversationHistory = previousMessages.map(msg => ({
    role: msg.senderType === 'victim' ? 'user' : 'assistant',
    content: msg.content
  }));

  // 4. Call AI unified analysis (or smart contextual fallback)
  let analysis;
  try {
    analysis = await aiService.analyzeAndRespond(content, conversationHistory, language);
  } catch (error) {
    console.error('[chatbotService] AI analysis exception:', error.message);
    analysis = aiService.getSmartFallback(content, language);
  }

  // 5. DUAL CRISIS CHECK — keyword OR LLM crisis_flag
  const isCrisis = keywordCrisis || analysis.crisis_flag;

  if (isCrisis) {
    analysis.crisis_flag = true;
    analysis.distress_score = Math.max(analysis.distress_score, 90);
    analysis.distress_band = 'Critical';

    // If reply is missing or generic greeting, ensure safety message with Indian Helplines
    if (!analysis.reply || analysis.reply.includes('Thank you for sharing') || analysis.reply.includes('साझा करने के लिए धन्यवाद')) {
      analysis.reply = aiService.getSafetyMessage(analysis.language_detected || langCode);
    }

    // Trigger parallel escalation without blocking the response
    triggerCrisisEscalation(victimId, content, analysis.language_detected || langCode, analysis.distress_score);
  }

  const distressBand = analysis.distress_band || aiService.getDistressBand(analysis.distress_score);
  const primaryEmotionRaw = analysis.emotions?.[0]?.label || 'neutral';
  const primaryEmotion = mapEmotion(primaryEmotionRaw);

  // 6. Save victim message with full metadata
  const userMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType: 'victim',
    content,
    isFlagged: isCrisis,
    metadata: {
      emotion: primaryEmotion,
      distressScore: analysis.distress_score,
      distressBand,
      language: langCode,
      sentiment: analysis.sentiment,
      emotions: analysis.emotions,
      crisis_flag: isCrisis,
      urgency_flag: urgencyFlag,
      language_detected: analysis.language_detected,
      source: analysis.source
    }
  });

  // 7. Update EmotionAnalysis record for counselor reports & trend charts
  try {
    let emotionDoc = await EmotionAnalysis.findOne({ victimId });
    if (!emotionDoc) {
      emotionDoc = new EmotionAnalysis({
        victimId,
        sessionId: session._id,
        distressScore: analysis.distress_score,
        distressBand,
        primaryEmotion,
        emotionsBreakdown: {
          Anxious: 0, Sad: 0, Fearful: 0, Angry: 0,
          Calm: 0, Hopeful: 0, Neutral: 0
        },
        recentLog: []
      });
    }

    // Rolling average distress score (weighted toward recent)
    if (isCrisis) {
      emotionDoc.distressScore = Math.max(85, analysis.distress_score);
    } else {
      emotionDoc.distressScore = Math.round(
        (emotionDoc.distressScore * 0.35) + (analysis.distress_score * 0.65)
      );
    }
    
    emotionDoc.distressBand = aiService.getDistressBand(emotionDoc.distressScore);
    emotionDoc.primaryEmotion = primaryEmotion;
    emotionDoc.sessionId = session._id;

    // Increment emotion breakdown count
    if (emotionDoc.emotionsBreakdown[primaryEmotion] !== undefined) {
      emotionDoc.emotionsBreakdown[primaryEmotion] += 1;
    } else {
      emotionDoc.emotionsBreakdown[primaryEmotion] = 1;
    }

    // Add to recent log
    emotionDoc.recentLog.unshift({
      message: content.substring(0, 120),
      emotion: primaryEmotion,
      distressScore: analysis.distress_score,
      timestamp: new Date()
    });
    if (emotionDoc.recentLog.length > 20) {
      emotionDoc.recentLog = emotionDoc.recentLog.slice(0, 20);
    }

    await emotionDoc.save();
  } catch (err) {
    console.error('[chatbotService] EmotionAnalysis update failed:', err.message);
  }

  // 8. Update session
  session.lastMessageAt = Date.now();
  if (session.title === 'New Conversation') {
    session.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }
  await session.save();

  // 9. Save AI response
  const aiMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType: isCrisis ? 'system' : 'ai',
    content: analysis.reply,
    isFlagged: isCrisis,
    metadata: {
      emotionResponseFor: primaryEmotion,
      language: langCode,
      source: analysis.source
    }
  });

  // 10. Return structured result
  return {
    userMessage,
    aiMessage,
    analysis: {
      sentiment: analysis.sentiment,
      emotions: analysis.emotions,
      distress_score: analysis.distress_score,
      distress_band: distressBand,
      crisis_flag: isCrisis,
      urgency_flag: urgencyFlag,
      language_detected: analysis.language_detected || langCode,
      primary_emotion: primaryEmotionRaw,
      primary_emotion_mapped: primaryEmotion,
      source: analysis.source
    }
  };
};

module.exports = {
  processVictimMessage
};

