const express = require('express');
const router = express.Router();
const {
  getMyVictims,
  getVictimProfileById,
  getVictimMentalHealthDashboard,
  getMyProfile,
  getAssignedCases,
  getAssignedCaseById,
  streamAssignedCaseDocument,
  getMyAppointments,
  createAppointment,
  updateAppointmentStatus,
  getFollowUps,
} = require('../controllers/counselorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('counselor'));

router.get('/profile', getMyProfile);
router.get('/victims', getMyVictims);
router.get('/victims/:id', getVictimProfileById);
router.get('/victims/:id/dashboard', getVictimMentalHealthDashboard);
router.get('/follow-ups', getFollowUps);
router.get('/assigned-cases', getAssignedCases);
router.get('/assigned-cases/:id', getAssignedCaseById);
router.get('/documents/:filename', streamAssignedCaseDocument);

// ── Appointments ──────────────────────────────────────────────────
router.get('/appointments', getMyAppointments);
router.post('/appointments', createAppointment);
router.patch('/appointments/:id', updateAppointmentStatus);

module.exports = router;
