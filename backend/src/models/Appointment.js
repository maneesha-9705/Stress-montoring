const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    victimId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    victimName:  { type: String, default: 'Walk-in / General' },
    title:       { type: String, required: true },
    notes:       { type: String, default: '' },
    scheduledAt: { type: Date, required: true },
    durationMin: { type: Number, default: 30 },
    mode:        { type: String, enum: ['in-person', 'tele', 'voice'], default: 'in-person' },
    status:      { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no-show'], default: 'scheduled' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
