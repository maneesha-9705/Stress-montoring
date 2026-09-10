import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

/* ─── helpers ─────────────────────────────────────────────────────── */
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(new Date(iso).getTime() + IST_OFFSET);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusColor = { scheduled: '#2563eb', completed: '#16a34a', cancelled: '#dc2626', 'no-show': '#d97706' };
const statusBg   = { scheduled: '#eff6ff', completed: '#f0fdf4', cancelled: '#fef2f2', 'no-show': '#fffbeb' };
const modeIcon   = { 'in-person': '🏥', tele: '💻', voice: '🎙️' };

/* ─── static daily routine ───────────────────────────────────────── */
const DAILY_ROUTINE = [
  { time: '08:00 AM', label: 'Morning Review',       desc: 'Review overnight alerts, pending cases, and new victim registrations.',     icon: '☀️', color: '#0ea5e9' },
  { time: '09:00 AM', label: 'Team Briefing',         desc: 'Short stand-up with fellow counselors — share updates and flag crises.',     icon: '👥', color: '#8b5cf6' },
  { time: '10:00 AM', label: 'Victim Sessions',       desc: 'Scheduled tele / in-person counseling sessions (Block 1 of 3).',            icon: '🤝', color: '#0d9488' },
  { time: '12:30 PM', label: 'Documentation Break',   desc: 'Complete clinical notes, update case records and risk assessments.',        icon: '📋', color: '#f59e0b' },
  { time: '01:30 PM', label: 'Lunch & Rest',          desc: 'Mandatory wellness break — step away from screens.',                        icon: '🌿', color: '#16a34a' },
  { time: '02:30 PM', label: 'Victim Sessions',       desc: 'Scheduled counseling sessions (Block 2 of 3).',                            icon: '🤝', color: '#0d9488' },
  { time: '04:30 PM', label: 'Welfare Coordination',  desc: 'Coordinate with welfare officers for support referrals and legal aid.',     icon: '⚖️', color: '#dc2626' },
  { time: '05:30 PM', label: 'Follow-Up Calls',       desc: 'Check-in calls for discharged or high-risk victims.',                      icon: '📞', color: '#2563eb' },
  { time: '06:30 PM', label: 'End-of-Day Report',     desc: 'Submit daily summary — cases handled, escalations raised, risk flags.',    icon: '📊', color: '#7c3aed' },
];

/* ─── component ──────────────────────────────────────────────────── */
export default function Appointments() {
  const [range, setRange]         = useState('today');
  const [appointments, setAppts]  = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    title: '', victimName: '', scheduledAt: '', durationMin: 30, mode: 'in-person', notes: '',
  });

  /* fetch appointments */
  const fetchAppts = async (r = range) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/counselor/appointments?range=${r}`);
      setAppts(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppts(range); }, [range]);

  /* book appointment */
  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/counselor/appointments', {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMin: Number(form.durationMin),
      });
      setSuccessMsg('Appointment booked successfully! ✅');
      setShowModal(false);
      setForm({ title: '', victimName: '', scheduledAt: '', durationMin: 30, mode: 'in-person', notes: '' });
      fetchAppts(range);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  /* status update */
  const handleStatus = async (id, status) => {
    try {
      await api.patch(`/counselor/appointments/${id}`, { status });
      setAppts((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    } catch {
      setError('Could not update appointment status.');
    }
  };

  /* ─── styles ─────────────────────────────────────────────────── */
  const s = {
    page:    { padding: '1.5rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f5f6fa', minHeight: '100%' },
    header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    h1:      { fontSize: '1.6rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
    sub:     { color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' },
    btn:     { backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.2rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem' },
    tab:     (active) => ({
      padding: '0.45rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700',
      backgroundColor: active ? '#2563eb' : '#f1f5f9', color: active ? '#fff' : '#475569',
    }),
    card:    { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    section: { marginBottom: '2rem' },
    sTitle:  { fontSize: '1.1rem', fontWeight: '800', color: '#1a1a2e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    pill:    (s) => ({
      display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '12px',
      fontSize: '0.7rem', fontWeight: '700', color: statusColor[s] || '#374151', backgroundColor: statusBg[s] || '#f9fafb', textTransform: 'uppercase',
    }),
    dot:     (color) => ({ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0, marginTop: 5 }),
    timeline:{ display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    tCard:   { display: 'flex', gap: '1rem', alignItems: 'flex-start', backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '10px', padding: '0.85rem 1rem' },
    tTime:   { minWidth: '72px', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', marginTop: '2px' },
    tIcon:   { fontSize: '1.3rem', minWidth: '28px' },
    tLabel:  { fontWeight: '700', fontSize: '0.875rem', color: '#1e293b' },
    tDesc:   { fontSize: '0.78rem', color: '#64748b', marginTop: '2px' },
    grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal:   { backgroundColor: '#fff', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
    label:   { display: 'block', marginBottom: '0.3rem', fontWeight: '600', fontSize: '0.8rem', color: '#374151' },
    input:   { width: '100%', border: '1px solid #d1d5db', borderRadius: '7px', padding: '0.55rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box', marginBottom: '0.9rem' },
    select:  { width: '100%', border: '1px solid #d1d5db', borderRadius: '7px', padding: '0.55rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box', marginBottom: '0.9rem', backgroundColor: '#fff' },
    fRow:    { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' },
    cancel:  { backgroundColor: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', padding: '0.6rem 1.1rem', fontWeight: '600', cursor: 'pointer' },
  };

  /* ─── render ─────────────────────────────────────────────────── */
  return (
    <div style={s.page}>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>📅 Appointments</h1>
          <p style={s.sub}>Manage your counseling sessions and view your daily wellness routine.</p>
        </div>
        <button style={s.btn} onClick={() => setShowModal(true)}>+ Book Appointment</button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: '600' }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* ── Two Column Layout ───────────────────────────────────── */}
      <div style={s.grid2}>

        {/* LEFT — Daily Routine Timeline */}
        <div style={s.section}>
          <div style={s.sTitle}>🕐 Counselor Daily Routine</div>
          <p style={{ ...s.sub, marginBottom: '1rem' }}>Recommended structured schedule for effective case management.</p>
          <div style={s.timeline}>
            {DAILY_ROUTINE.map((r, i) => (
              <div key={i} style={s.tCard}>
                <div style={s.dot(r.color)} />
                <span style={s.tTime}>{r.time}</span>
                <span style={s.tIcon}>{r.icon}</span>
                <div>
                  <div style={{ ...s.tLabel, borderLeft: `3px solid ${r.color}`, paddingLeft: '0.5rem' }}>{r.label}</div>
                  <div style={s.tDesc}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Live Appointments from Backend */}
        <div style={s.section}>
          <div style={{ ...s.sTitle, justifyContent: 'space-between' }}>
            <span>📋 My Appointments</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['today', 'week', 'all'].map((r) => (
                <button key={r} style={s.tab(range === r)} onClick={() => setRange(r)}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ color: '#64748b', padding: '2rem', textAlign: 'center' }}>Loading appointments…</div>
          ) : appointments.length === 0 ? (
            <div style={{ backgroundColor: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
              <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem' }}>No appointments {range === 'today' ? 'today' : `this ${range}`}</div>
              <div style={{ fontSize: '0.8rem' }}>Click <strong>"+ Book Appointment"</strong> to schedule one.</div>
            </div>
          ) : (
            <div>
              {appointments.map((appt) => (
                <div key={appt._id} style={{ ...s.card, borderLeft: `4px solid ${statusColor[appt.status] || '#e5e7eb'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>{appt.title}</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        👤 {appt.victimName} &nbsp;|&nbsp; {modeIcon[appt.mode]} {appt.mode}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                        🕐 {fmtTime(appt.scheduledAt)} &nbsp;·&nbsp; {fmtDate(appt.scheduledAt)} &nbsp;·&nbsp; {appt.durationMin} min
                      </div>
                      {appt.notes && <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>📝 {appt.notes}</div>}
                    </div>
                    <span style={s.pill(appt.status)}>{appt.status}</span>
                  </div>
                  {appt.status === 'scheduled' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button onClick={() => handleStatus(appt._id, 'completed')}
                        style={{ ...s.btn, backgroundColor: '#16a34a', padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}>✔ Done</button>
                      <button onClick={() => handleStatus(appt._id, 'no-show')}
                        style={{ ...s.btn, backgroundColor: '#d97706', padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}>⚠ No-show</button>
                      <button onClick={() => handleStatus(appt._id, 'cancelled')}
                        style={{ ...s.btn, backgroundColor: '#dc2626', padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}>✕ Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Wellness Tips Strip ────────────────────────────── */}
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1rem 1.25rem', marginTop: '1.5rem' }}>
            <div style={{ fontWeight: '700', color: '#0369a1', marginBottom: '0.5rem', fontSize: '0.875rem' }}>💡 Counselor Wellness Reminders</div>
            {[
              '🌬️ Take 3 deep breaths between back-to-back sessions.',
              '💧 Stay hydrated — keep water at your desk.',
              '📵 Avoid checking case alerts after 8 PM — protect your off-hours.',
              '🧘 Use the lunch break for a short mindfulness practice.',
            ].map((tip, i) => (
              <div key={i} style={{ fontSize: '0.775rem', color: '#0c4a6e', marginBottom: '0.3rem' }}>{tip}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Book Appointment Modal ───────────────────────────────── */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.2rem', color: '#0f172a' }}>📅 Book New Appointment</h2>
            <form onSubmit={handleBook}>
              <label style={s.label}>Session Title *</label>
              <input style={s.input} required placeholder="e.g. Initial Counseling Session"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

              <label style={s.label}>Victim / Client Name</label>
              <input style={s.input} placeholder="Leave blank for walk-in"
                value={form.victimName} onChange={(e) => setForm({ ...form, victimName: e.target.value })} />

              <label style={s.label}>Scheduled Date & Time *</label>
              <input style={s.input} type="datetime-local" required
                value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />

              <label style={s.label}>Duration (minutes)</label>
              <input style={s.input} type="number" min={15} max={180}
                value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} />

              <label style={s.label}>Mode</label>
              <select style={s.select} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option value="in-person">🏥 In-Person</option>
                <option value="tele">💻 Tele-consultation</option>
                <option value="voice">🎙️ Voice Call</option>
              </select>

              <label style={s.label}>Notes (optional)</label>
              <textarea style={{ ...s.input, height: '70px', resize: 'vertical' }} placeholder="Any special notes or pre-session instructions…"
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

              {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</div>}

              <div style={s.fRow}>
                <button type="button" style={s.cancel} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={s.btn} disabled={submitting}>
                  {submitting ? 'Booking…' : '✔ Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
