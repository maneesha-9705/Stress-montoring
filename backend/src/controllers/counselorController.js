const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Victim = require('../models/Victim');
const Counselor = require('../models/Counselor');
const Case = require('../models/Case');
const EmotionAnalysis = require('../models/EmotionAnalysis');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const DailyUpdate = require('../models/DailyUpdate');
const Alert = require('../models/Alert');
const Appointment = require('../models/Appointment');

// ─── helpers ────────────────────────────────────────────────────
const isMongoObjectIdString = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));

const normalizeObjectId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return isMongoObjectIdString(value) ? value.toLowerCase() : null;
  if (typeof value === 'object') {
    if (typeof value.toHexString === 'function') return value.toHexString();
    if (value._id && typeof value._id === 'object' && typeof value._id.toHexString === 'function') return value._id.toHexString();
    if (value._id && typeof value._id === 'string') return isMongoObjectIdString(value._id) ? value._id.toLowerCase() : null;
    if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
  }
  return null;
};

// Verify that the requested victimId is assigned to the authenticated counselor.
// Checks both Case.assignedCounselorId (Counselor profile _id) and Assignment.counselorId (User _id).
const verifyCounselorVictimAccess = async (authenticatedUserId, victimId) => {
  const counselor = await Counselor.findOne({ userId: authenticatedUserId }).lean();
  const [caseMatch, assignmentMatch] = await Promise.all([
    counselor
      ? Case.findOne({ victimId, assignedCounselorId: counselor._id }).lean()
      : null,
    Assignment.findOne({ victimId, counselorId: authenticatedUserId, status: 'active' }).lean(),
  ]);
  return { counselor, authorized: !!(caseMatch || assignmentMatch), caseMatch, assignmentMatch };
};

// ─── IST timezone helpers ────────────────────────────────────────
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30

const getISTDayBoundaries = () => {
  const nowUTC = Date.now();
  const nowISTMs = nowUTC + IST_OFFSET_MS;
  const nowIST = new Date(nowISTMs);
  const startOfDayIST = new Date(nowIST);
  startOfDayIST.setUTCHours(0, 0, 0, 0);
  const endOfDayIST = new Date(nowIST);
  endOfDayIST.setUTCHours(23, 59, 59, 999);
  // Convert back to UTC for MongoDB
  const todayStartUTC = new Date(startOfDayIST.getTime() - IST_OFFSET_MS);
  const todayEndUTC = new Date(endOfDayIST.getTime() - IST_OFFSET_MS);
  const thirtyDaysAgoUTC = new Date(todayStartUTC.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { todayStartUTC, todayEndUTC, thirtyDaysAgoUTC };
};

const getISTHour = (utcDate) => {
  const istMs = new Date(utcDate).getTime() + IST_OFFSET_MS;
  return new Date(istMs).getUTCHours();
};

const computeDominantEmotion = (emotions) => {
  const counts = {};
  emotions.forEach((e) => { if (e) counts[e] = (counts[e] || 0) + 1; });
  let dominant = null;
  let max = 0;
  Object.entries(counts).forEach(([e, c]) => { if (c > max) { max = c; dominant = e; } });
  return dominant;
};

const buildBucketSummary = (msgs) => {
  if (!msgs || msgs.length === 0) return null;
  const withDs = msgs.filter((m) => m.metadata?.distressScore != null);
  const avgDistressScore =
    withDs.length > 0
      ? Math.round(withDs.reduce((s, m) => s + m.metadata.distressScore, 0) / withDs.length)
      : null;
  const dominantEmotion = computeDominantEmotion(msgs.map((m) => m.metadata?.emotion));
  return { count: msgs.length, avgDistressScore, dominantEmotion };
};

// ─── CONTROLLERS ─────────────────────────────────────────────────

// @desc    Get counselor profile
// @route   GET /api/v1/counselor/profile
// @access  Private/Counselor
const getMyProfile = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const counselor = await Counselor.findOne({ userId: authenticatedUserId });
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found for the authenticated user.');
  }
  res.json({ success: true, data: counselor });
});

// @desc    Get assigned victims with distress score analysis & overall counselor metrics
// @route   GET /api/v1/counselor/victims
// @access  Private/Counselor
const getMyVictims = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const counselor = await Counselor.findOne({ userId: authenticatedUserId });

  const caseRecords = counselor
    ? await Case.find({ assignedCounselorId: counselor._id }).populate('victimId', 'name email phone state district registrationId')
    : [];
  const assignments = await Assignment.find({ counselorId: authenticatedUserId, status: 'active' });

  const victimUserIdSet = new Set();
  caseRecords.forEach((c) => {
    if (c.victimId?._id) victimUserIdSet.add(c.victimId._id.toString());
    else if (c.victimId) victimUserIdSet.add(c.victimId.toString());
  });
  assignments.forEach((a) => {
    if (a.victimId) victimUserIdSet.add(a.victimId.toString());
  });

  const victimUserIds = Array.from(victimUserIdSet);
  const victimProfiles = await Victim.find({ userId: { $in: victimUserIds } }).select('-aadhaarNumber -panNumber');
  const emotionAnalyses = await EmotionAnalysis.find({ victimId: { $in: victimUserIds } }).lean();

  let totalDistressSum = 0;
  let highRiskCount = 0;
  let moderateRiskCount = 0;
  let lowRiskCount = 0;
  const combinedEmotions = { Anxious: 0, Sad: 0, Fearful: 0, Angry: 0, Calm: 0, Hopeful: 0, Neutral: 0 };

  const victimList = victimUserIds.map((vUserId) => {
    const vProfile = victimProfiles.find((p) => p.userId?.toString() === vUserId) || {};
    const matchedCase = caseRecords.find((c) => (c.victimId?._id || c.victimId)?.toString() === vUserId) || {};
    let analysis = emotionAnalyses.find((a) => a.victimId?.toString() === vUserId);

    if (!analysis) {
      analysis = {
        distressScore: 25, distressBand: 'Low', primaryEmotion: 'Calm',
        emotionsBreakdown: { Anxious: 1, Sad: 0, Fearful: 0, Angry: 0, Calm: 2, Hopeful: 1, Neutral: 1 },
      };
    }

    const score = analysis.distressScore || 20;
    totalDistressSum += score;

    if (score >= 50 || analysis.distressBand === 'High' || analysis.distressBand === 'Severe') highRiskCount++;
    else if (score >= 25 || analysis.distressBand === 'Moderate') moderateRiskCount++;
    else lowRiskCount++;

    if (analysis.emotionsBreakdown) {
      Object.entries(analysis.emotionsBreakdown).forEach(([eKey, count]) => {
        if (combinedEmotions[eKey] !== undefined) combinedEmotions[eKey] += count || 0;
      });
    }

    return {
      _id: vUserId, victimId: vUserId,
      name: vProfile.name || matchedCase.victimId?.name || 'Assigned Victim',
      email: vProfile.email || matchedCase.victimId?.email || 'N/A',
      phone: vProfile.phone || matchedCase.victimId?.phone || 'N/A',
      gender: vProfile.gender || 'N/A',
      dob: vProfile.dob || null,
      district: vProfile.district || matchedCase.victimId?.district || 'N/A',
      state: vProfile.state || matchedCase.victimId?.state || 'N/A',
      address: vProfile.address || 'N/A',
      emergencyContacts: vProfile.emergencyContacts || [],
      caseId: matchedCase.caseId || matchedCase._id || null,
      category: matchedCase.category || 'Support Request',
      caseStatus: matchedCase.status || 'Assigned',
      assignedAt: matchedCase.assignedAt || matchedCase.createdAt || new Date(),
      lastInteractionAt: analysis?.updatedAt || matchedCase.assignedAt || matchedCase.createdAt || new Date(),
      distressAnalysis: analysis,
    };
  });

  const totalVictims = victimList.length || 1;
  const avgDistressScore = Math.round(totalDistressSum / totalVictims);
  let overallBand = 'Low';
  if (avgDistressScore >= 75) overallBand = 'Severe';
  else if (avgDistressScore >= 50) overallBand = 'High';
  else if (avgDistressScore >= 25) overallBand = 'Moderate';

  res.json({
    success: true, count: victimList.length, data: victimList,
    overallAnalytics: { totalVictims: victimList.length, avgDistressScore, overallBand, highRiskCount, moderateRiskCount, lowRiskCount, combinedEmotions },
  });
});

// @desc    Get detailed victim profile — AUTHORIZATION FIXED
// @route   GET /api/v1/counselor/victims/:id
// @access  Private/Counselor
const getVictimProfileById = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const victimId = req.params.id;

  if (!isMongoObjectIdString(victimId)) {
    res.status(404);
    throw new Error('Victim not found.');
  }

  // SECURITY: verify counselor is assigned to this victim
  const { authorized } = await verifyCounselorVictimAccess(authenticatedUserId, victimId);
  if (!authorized) {
    res.status(403);
    throw new Error('Forbidden: This victim is not assigned to your counselor profile.');
  }

  const victim = await Victim.findOne({ userId: victimId }).select('-aadhaarNumber -panNumber');
  const userCases = await Case.find({ victimId }).sort({ createdAt: -1 });
  let distressAnalysis = await EmotionAnalysis.findOne({ victimId }).lean();

  if (!distressAnalysis) {
    distressAnalysis = {
      distressScore: null, distressBand: null, primaryEmotion: null,
      emotionsBreakdown: { Anxious: 0, Sad: 0, Fearful: 0, Angry: 0, Calm: 0, Hopeful: 0, Neutral: 0 },
      recentLog: [],
    };
  }

  res.json({
    success: true,
    data: { profile: victim ? victim.toObject() : { userId: victimId, name: 'Assigned Victim' }, cases: userCases, distressAnalysis },
  });
});

// @desc    Individual victim mental health dashboard — COMPLETE AGGREGATION
// @route   GET /api/v1/counselor/victims/:id/dashboard
// @access  Private/Counselor
const getVictimMentalHealthDashboard = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const victimId = req.params.id;

  if (!isMongoObjectIdString(victimId)) {
    res.status(404);
    throw new Error('Victim not found.');
  }

  // SECURITY: verify counselor is assigned to this victim
  const { authorized } = await verifyCounselorVictimAccess(authenticatedUserId, victimId);
  if (!authorized) {
    res.status(403);
    throw new Error('Forbidden: This victim is not assigned to your counselor profile.');
  }

  // ── Date boundaries (Asia/Kolkata) ─────────────────────────────
  const { todayStartUTC, todayEndUTC, thirtyDaysAgoUTC } = getISTDayBoundaries();

  // ── 1. Victim profile ──────────────────────────────────────────
  const victim = await Victim.findOne({ userId: victimId }).select('-aadhaarNumber -panNumber').lean();
  const victimUser = await User.findById(victimId).select('profileImage').lean();

  // ── 2. Case info ───────────────────────────────────────────────
  const caseRecord = await Case.findOne({ victimId }).sort({ assignedAt: -1 }).lean();

  // ── 3. EmotionAnalysis rolling document (lifetime aggregate) ───
  const emotionAnalysis = await EmotionAnalysis.findOne({ victimId }).lean();

  // ── 4. Chat sessions ───────────────────────────────────────────
  const sessions = await ChatSession.find({ victimId }).select('_id').lean();
  const sessionIds = sessions.map((s) => s._id);

  // ── 5. 30-day daily trend (MongoDB aggregation) ────────────────
  let dailyTrend = [];
  if (sessionIds.length > 0) {
    const rawTrend = await ChatMessage.aggregate([
      {
        $match: {
          sessionId: { $in: sessionIds },
          senderType: 'victim',
          'metadata.distressScore': { $exists: true, $type: 'number' },
          createdAt: { $gte: thirtyDaysAgoUTC, $lte: todayEndUTC },
        },
      },
      {
        $addFields: {
          dateIST: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' },
          },
        },
      },
      {
        $group: {
          _id: '$dateIST',
          avgDistressScore: { $avg: '$metadata.distressScore' },
          messageCount: { $sum: 1 },
          crisisCount: { $sum: { $cond: [{ $eq: ['$isFlagged', true] }, 1, 0] } },
          emotions: { $push: '$metadata.emotion' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    dailyTrend = rawTrend.map((day) => ({
      date: day._id,
      avgDistressScore: Math.round(day.avgDistressScore),
      messageCount: day.messageCount,
      crisisCount: day.crisisCount,
      dominantEmotion: computeDominantEmotion(day.emotions || []),
    }));
  }

  // ── 6. Today's messages ────────────────────────────────────────
  let todayData = {
    interactionCount: 0,
    lastInteractionAt: null,
    avgDistressScore: null,
    dominantEmotion: null,
    crisisMessageCount: 0,
    latestAnalysisTimestamp: null,
    selfReportedFeeling: null,
    selfReportedAt: null,
  };
  let timeOfDay = { morning: null, afternoon: null, evening: null, night: null };

  if (sessionIds.length > 0) {
    const todayMsgs = await ChatMessage.find({
      sessionId: { $in: sessionIds },
      senderType: 'victim',
      createdAt: { $gte: todayStartUTC, $lte: todayEndUTC },
    })
      .select('metadata.distressScore metadata.emotion isFlagged createdAt')
      .lean();

    if (todayMsgs.length > 0) {
      const withDs = todayMsgs.filter((m) => m.metadata?.distressScore != null);
      const avgDs =
        withDs.length > 0
          ? Math.round(withDs.reduce((s, m) => s + m.metadata.distressScore, 0) / withDs.length)
          : null;
      const crisisCount = todayMsgs.filter((m) => m.isFlagged).length;
      const sorted = [...todayMsgs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      todayData.interactionCount = todayMsgs.length;
      todayData.lastInteractionAt = sorted[0].createdAt;
      todayData.latestAnalysisTimestamp = sorted[0].createdAt;
      todayData.avgDistressScore = avgDs;
      todayData.dominantEmotion = computeDominantEmotion(todayMsgs.map((m) => m.metadata?.emotion));
      todayData.crisisMessageCount = crisisCount;

      // Time-of-day grouping (IST hours: morning 5-11, afternoon 12-17, evening 18-23, night 0-4)
      const buckets = { morning: [], afternoon: [], evening: [], night: [] };
      todayMsgs.forEach((m) => {
        const h = getISTHour(m.createdAt);
        if (h >= 5 && h <= 11) buckets.morning.push(m);
        else if (h >= 12 && h <= 17) buckets.afternoon.push(m);
        else if (h >= 18 && h <= 23) buckets.evening.push(m);
        else buckets.night.push(m); // 00:00–04:59
      });

      timeOfDay = {
        morning: buildBucketSummary(buckets.morning),
        afternoon: buildBucketSummary(buckets.afternoon),
        evening: buildBucketSummary(buckets.evening),
        night: buildBucketSummary(buckets.night),
      };
    }
  }

  // ── 7. Today's DailyUpdate (self-reported feeling) ────────────
  const todayCheckin = await DailyUpdate.findOne({
    victimId,
    createdAt: { $gte: todayStartUTC, $lte: todayEndUTC },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (todayCheckin) {
    todayData.selfReportedFeeling = todayCheckin.feeling;
    todayData.selfReportedAt = todayCheckin.createdAt;
  }

  // ── 8. Open alerts for this victim ────────────────────────────
  const alerts = await Alert.find({
    victimId,
    status: { $in: ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS'] },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // ── 9. Crisis indicator (derived from today's chat only) ───────
  const hasTodayCrisis = todayData.crisisMessageCount > 0;

  // ── 10. Current status from rolling EmotionAnalysis ───────────
  const currentStatus = emotionAnalysis
    ? {
        distressScore: emotionAnalysis.distressScore,
        distressBand: emotionAnalysis.distressBand,
        primaryEmotion: emotionAnalysis.primaryEmotion,
        emotionsBreakdown: emotionAnalysis.emotionsBreakdown,
        lastAnalyzedAt: emotionAnalysis.updatedAt,
        crisisActive: hasTodayCrisis,
      }
    : {
        distressScore: null,
        distressBand: null,
        primaryEmotion: null,
        emotionsBreakdown: null,
        lastAnalyzedAt: null,
        crisisActive: hasTodayCrisis,
      };

  const victimWithUser = victim ? { ...victim, userId: { ...victim.userId, profileImage: victimUser?.profileImage } } : { userId: { _id: victimId, profileImage: victimUser?.profileImage } };

  res.json({
    success: true,
    data: {
      victim: victimWithUser,
      caseInfo: caseRecord
        ? {
            caseId: caseRecord.caseId,
            category: caseRecord.category,
            status: caseRecord.status,
            assignedAt: caseRecord.assignedAt,
            firDetails: caseRecord.firDetails,
          }
        : null,
      currentStatus,
      today: todayData,
      timeOfDay,
      dailyTrend,
      alerts,
      sessionCount: sessions.length,
    },
  });
});

// @desc    Get all cases assigned to the authenticated counselor
// @route   GET /api/v1/counselor/assigned-cases
// @access  Private/Counselor
const getAssignedCases = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const counselor = await Counselor.findOne({ userId: authenticatedUserId });
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found for the authenticated user.');
  }
  const cases = await Case.find({ assignedCounselorId: counselor._id })
    .populate('victimId', 'name email phone state district registrationId')
    .populate('assignedCounselorId', 'name profession qualification district state profileImage phone experience')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: cases.length, data: cases });
});

// @desc    Get one assigned case (counselor-owned only)
// @route   GET /api/v1/counselor/assigned-cases/:id
// @access  Private/Counselor
const getAssignedCaseById = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const counselor = await Counselor.findOne({ userId: authenticatedUserId });
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found for the authenticated user.');
  }
  if (!isMongoObjectIdString(req.params.id)) {
    res.status(404);
    throw new Error('Assigned case not found');
  }

  const singleCase = await Case.findById(req.params.id)
    .populate('victimId', 'email state district registrationId')
    .populate('assignedCounselorId', 'name profession qualification district state profileImage phone experience');

  if (!singleCase) {
    res.status(404);
    throw new Error('Assigned case not found');
  }

  const assignedCounselorObjectId = normalizeObjectId(singleCase.assignedCounselorId);
  const counselorProfileObjectId = normalizeObjectId(counselor._id);
  if (!assignedCounselorObjectId || assignedCounselorObjectId !== counselorProfileObjectId) {
    res.status(403);
    throw new Error('Forbidden: this case is not assigned to your counselor profile');
  }

  const victimUserId = singleCase.victimId?._id || singleCase.victimId;
  const victim = victimUserId ? await Victim.findOne({ userId: victimUserId }).select('-aadhaarNumber -panNumber') : null;
  const victimUser = victimUserId ? await User.findById(victimUserId).select('profileImage').lean() : null;
  let distressAnalysis = null;
  if (victimUserId) distressAnalysis = await EmotionAnalysis.findOne({ victimId: victimUserId }).lean();

  if (!distressAnalysis) {
    distressAnalysis = {
      distressScore: 25, distressBand: 'Low', primaryEmotion: 'Calm',
      emotionsBreakdown: { Anxious: 1, Sad: 1, Fearful: 0, Angry: 0, Calm: 3, Hopeful: 2, Neutral: 2 },
      recentLog: [{ message: 'Initial check-in completed.', emotion: 'Calm', distressScore: 25, timestamp: new Date() }],
    };
  }

  const caseData = singleCase.toObject();
  const userInfo = caseData.victimId && typeof caseData.victimId === 'object' ? caseData.victimId : {};
  const victimData = victim ? victim.toObject() : {};

  const victimResponse = victimData ? {
    ...victimData,
    email: userInfo.email || null,
    state: userInfo.state || null,
    district: userInfo.district || null,
    registrationId: userInfo.registrationId || null,
    userId: victimData.userId ? { ...victimData.userId, profileImage: victimUser?.profileImage } : { profileImage: victimUser?.profileImage }
  } : null;

  res.json({
    success: true,
    data: {
      case: caseData,
      victim: victimResponse,
      distressAnalysis,
    },
  });
});

// @desc    Stream a document for a case assigned to the authenticated counselor
// @route   GET /api/v1/counselor/documents/:filename
// @access  Private/Counselor
const streamAssignedCaseDocument = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const filename = path.basename(req.params.filename || '');
  const counselor = await Counselor.findOne({ userId: authenticatedUserId });
  if (!counselor) {
    res.status(404);
    throw new Error('Counselor profile not found for the authenticated user.');
  }
  const ownedCase = await Case.findOne({ assignedCounselorId: counselor._id, 'documents.fileName': filename });
  if (!ownedCase) {
    res.status(403);
    throw new Error('Not authorized to access this document');
  }
  const filePath = path.join(__dirname, '../../uploads/documents', filename);
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error('Document file not found on server');
  }
  res.sendFile(filePath);
});

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

// @desc    Get today's + upcoming appointments for the authenticated counselor
// @route   GET /api/v1/counselor/appointments
// @access  Private/Counselor
const getMyAppointments = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const { range = 'today' } = req.query; // 'today' | 'week' | 'all'

  const now = new Date();
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const nowISTMs = now.getTime() + IST_OFFSET_MS;
  const nowIST = new Date(nowISTMs);

  const startOfDayIST = new Date(nowIST);
  startOfDayIST.setUTCHours(0, 0, 0, 0);
  const todayStartUTC = new Date(startOfDayIST.getTime() - IST_OFFSET_MS);

  let endUTC;
  if (range === 'week') {
    endUTC = new Date(todayStartUTC.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (range === 'all') {
    endUTC = new Date('2099-12-31');
  } else {
    const endOfDayIST = new Date(nowIST);
    endOfDayIST.setUTCHours(23, 59, 59, 999);
    endUTC = new Date(endOfDayIST.getTime() - IST_OFFSET_MS);
  }

  const appointments = await Appointment.find({
    counselorId: authenticatedUserId,
    scheduledAt: { $gte: todayStartUTC, $lte: endUTC },
  }).sort({ scheduledAt: 1 }).lean();

  res.json({ success: true, count: appointments.length, data: appointments });
});

// @desc    Book a new appointment
// @route   POST /api/v1/counselor/appointments
// @access  Private/Counselor
const createAppointment = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const { victimId, victimName, title, notes, scheduledAt, durationMin, mode } = req.body;

  if (!title || !scheduledAt) {
    res.status(400);
    throw new Error('Title and scheduledAt are required.');
  }

  const appt = await Appointment.create({
    counselorId: authenticatedUserId,
    victimId: victimId || null,
    victimName: victimName || 'Walk-in / General',
    title,
    notes: notes || '',
    scheduledAt: new Date(scheduledAt),
    durationMin: durationMin || 30,
    mode: mode || 'in-person',
    status: 'scheduled',
  });

  res.status(201).json({ success: true, data: appt });
});

// @desc    Update appointment status (complete / cancel / no-show)
// @route   PATCH /api/v1/counselor/appointments/:id
// @access  Private/Counselor
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const { status } = req.body;

  const appt = await Appointment.findOne({ _id: req.params.id, counselorId: authenticatedUserId });
  if (!appt) {
    res.status(404);
    throw new Error('Appointment not found or not owned by you.');
  }

  if (status) appt.status = status;
  await appt.save();

  res.json({ success: true, data: appt });
});

// @desc    Get follow-ups tracking list and selected victim follow-up metrics
// @route   GET /api/v1/counselor/follow-ups
// @access  Private/Counselor
const getFollowUps = asyncHandler(async (req, res) => {
  const authenticatedUserId = req.user?.userId || req.user?.id || req.user?._id;
  const counselor = await Counselor.findOne({ userId: authenticatedUserId });

  const caseRecords = counselor
    ? await Case.find({ assignedCounselorId: counselor._id }).populate('victimId', 'name email phone state district registrationId')
    : [];
  const assignments = await Assignment.find({ counselorId: authenticatedUserId, status: 'active' });

  const victimUserIdSet = new Set();
  caseRecords.forEach((c) => {
    if (c.victimId?._id) victimUserIdSet.add(c.victimId._id.toString());
    else if (c.victimId) victimUserIdSet.add(c.victimId.toString());
  });
  assignments.forEach((a) => {
    if (a.victimId) victimUserIdSet.add(a.victimId.toString());
  });

  const victimUserIds = Array.from(victimUserIdSet);
  const victimProfiles = await Victim.find({ userId: { $in: victimUserIds } }).select('-aadhaarNumber -panNumber');
  const emotionAnalyses = await EmotionAnalysis.find({ victimId: { $in: victimUserIds } }).lean();
  const appointments = await Appointment.find({ counselorId: authenticatedUserId }).sort({ scheduledAt: -1 }).lean();

  const now = new Date();

  const followUpList = victimUserIds.map((vUserId) => {
    const vProfile = victimProfiles.find((p) => p.userId?.toString() === vUserId) || {};
    const matchedCase = caseRecords.find((c) => (c.victimId?._id || c.victimId)?.toString() === vUserId) || {};
    const analysis = emotionAnalyses.find((a) => a.victimId?.toString() === vUserId) || {
      distressScore: 25, distressBand: 'Low', primaryEmotion: 'Calm',
    };
    
    // Find victim appointments
    const victimAppts = appointments.filter((a) => a.victimId?.toString() === vUserId);
    const nextAppt = victimAppts.find((a) => new Date(a.scheduledAt) >= now && a.status === 'scheduled');
    const lastAppt = victimAppts.find((a) => new Date(a.scheduledAt) < now || a.status === 'completed');

    const score = analysis.distressScore || 20;
    const band = analysis.distressBand || (score >= 75 ? 'Severe' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low');

    // Determine due date interval based on risk severity
    const intervalDays = band === 'Severe' ? 2 : band === 'High' ? 3 : band === 'Moderate' ? 7 : 14;
    const lastContact = lastAppt?.scheduledAt || analysis.updatedAt || matchedCase.assignedAt || matchedCase.createdAt || now;
    
    let nextDue = nextAppt?.scheduledAt;
    if (!nextDue) {
      const calculatedDue = new Date(new Date(lastContact).getTime() + intervalDays * 24 * 60 * 60 * 1000);
      nextDue = calculatedDue;
    }

    const isOverdue = new Date(nextDue) < now && (!nextAppt || nextAppt.status !== 'completed');
    const method = nextAppt?.mode === 'tele' ? 'Tele-consult' : nextAppt?.mode === 'voice' ? 'Phone Call' : 'In-Person';
    const status = isOverdue ? 'Overdue' : nextAppt?.status === 'completed' ? 'Completed' : 'Scheduled';

    return {
      _id: vUserId,
      victimId: vUserId,
      name: vProfile.name || matchedCase.victimId?.name || 'Assigned Victim',
      caseId: matchedCase.caseId || (matchedCase._id ? `ARH-${matchedCase._id.toString().slice(-4).toUpperCase()}` : 'N/A'),
      category: matchedCase.category || 'General Counseling',
      district: vProfile.district || matchedCase.victimId?.district || 'N/A',
      state: vProfile.state || matchedCase.victimId?.state || 'N/A',
      phone: vProfile.phone || matchedCase.victimId?.phone || 'N/A',
      distressScore: score,
      distressBand: band,
      primaryEmotion: analysis.primaryEmotion || 'Calm',
      lastContactedAt: lastContact,
      nextFollowUpDue: nextDue,
      method,
      status,
      isOverdue,
      notes: nextAppt?.notes || `Routine ${band.toLowerCase()} risk follow-up check-in.`,
      lastInteractionAt: analysis.updatedAt || lastContact,
      appointmentId: nextAppt?._id || null,
    };
  });

  // Sort follow-ups so Overdue and High/Severe risk appear first
  followUpList.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return (b.distressScore || 0) - (a.distressScore || 0);
  });

  res.json({
    success: true,
    count: followUpList.length,
    data: followUpList,
  });
});

module.exports = {
  normalizeObjectId,
  getMyProfile,
  getMyVictims,
  getVictimProfileById,
  getVictimMentalHealthDashboard,
  getAssignedCases,
  getAssignedCaseById,
  streamAssignedCaseDocument,
  getMyAppointments,
  createAppointment,
  updateAppointmentStatus,
  getFollowUps,
};
