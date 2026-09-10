import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import DistressTrendChart from '../../components/charts/DistressTrendChart';

// ── Constants ──────────────────────────────────────────────────
const REFRESH_INTERVAL_MS = 60000; // 60 seconds

const BAND_STYLES = {
  Low:      { bg: '#f6fbf8', text: '#15803d', border: '#bbf7d0', bar: '#22c55e', label: 'LOW' },
  Moderate: { bg: '#fff8e6', text: '#c2410c', border: '#fde047', bar: '#eab308', label: 'MODERATE' },
  High:     { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', bar: '#f43f5e', label: 'HIGH' },
  Severe:   { bg: '#fdecec', text: '#b91c1c', border: '#fca5a5', bar: '#ef4444', label: 'SEVERE' },
};

const SEVERITY_STYLES = {
  LOW:      { bg: '#f6fbf8', text: '#15803d' },
  MEDIUM:   { bg: '#fff8e6', text: '#c2410c' },
  HIGH:     { bg: '#fff1f2', text: '#be123c' },
  CRITICAL: { bg: '#fdecec', text: '#b91c1c' },
};

const EMOTION_ICONS = {
  Fearful: '😨 Fearful', Anxious: '😟 Anxious', Sad: '😢 Sad',
  Angry: '😠 Angry', Calm: '😌 Calm', Hopeful: '🌟 Hopeful', Neutral: '😐 Neutral',
};

const FEELING_ICONS = {
  'Very good': '😄 Very Good', Good: '🙂 Good', Okay: '😐 Okay',
  Bad: '😟 Bad', 'Very bad': '😢 Very Bad',
};

const FEELING_COLOR = {
  'Very good': '#15803d', Good: '#0284c7', Okay: '#78716c',
  Bad: '#c2410c', 'Very bad': '#b91c1c',
};

// ── Helper formatters ─────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
const fmtDateTime = (d) => d ? `${fmtDate(d)} ${fmtTime(d)}` : 'N/A';
const display = (v) => (v != null && v !== '') ? v : 'N/A';

// ── Sub-components ────────────────────────────────────────────

function CrisisBanner() {
  return (
    <div style={{
      background: '#fdecec', border: '1px solid #ef4444', borderRadius: 8,
      padding: '0.85rem 1.25rem', marginBottom: '1.25rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
      <span style={{ fontSize: '1.5rem' }}>🚨</span>
      <div>
        <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '1rem' }}>CRISIS SIGNAL DETECTED — TODAY</div>
        <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: 2 }}>
          One or more of today&apos;s chatbot interactions triggered an AI-detected crisis signal.
          This is a monitoring indicator only — not a clinical diagnosis.
          Please contact the victim directly and assess their current wellbeing.
        </div>
      </div>
    </div>
  );
}

function RiskLevelCard({ status }) {
  if (!status || status.distressBand == null) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Overall Risk Level
        </h3>
        <div style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No analysis available yet</div>
      </div>
    );
  }
  const bs = BAND_STYLES[status.distressBand] || BAND_STYLES.Low;
  return (
    <div style={{ background: bs.bg, border: `1px solid ${bs.border}`, borderRadius: 10, padding: '1.25rem' }}>
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Overall Risk Level
      </h3>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: bs.text, lineHeight: 1.1 }}>
        {bs.label}
      </div>
      <div style={{ marginTop: '0.5rem', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, Math.max(4, status.distressScore || 0))}%`, height: '100%', background: bs.bar, borderRadius: 4 }} />
      </div>
      <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: bs.text, fontWeight: 600 }}>
        Distress Score: {status.distressScore}/100
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#374151' }}>
        <div>Emotion: <strong>{EMOTION_ICONS[status.primaryEmotion] || display(status.primaryEmotion)}</strong></div>
        <div style={{ marginTop: 4 }}>
          Crisis today:{' '}
          <strong style={{ color: status.crisisActive ? '#b91c1c' : '#15803d' }}>
            {status.crisisActive ? '⚠ Yes' : '✓ None detected'}
          </strong>
        </div>
        {status.lastAnalyzedAt && (
          <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#64748b' }}>
            Last analysis: {fmtDateTime(status.lastAnalyzedAt)}
          </div>
        )}
      </div>
    </div>
  );
}

function TodayEmotionCard({ today }) {
  const hasData = today && today.interactionCount > 0;
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Today&apos;s Emotion
      </h3>
      {hasData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
            {EMOTION_ICONS[today.dominantEmotion] || display(today.dominantEmotion)}
          </div>
          {today.avgDistressScore != null && (
            <div style={{ fontSize: '0.85rem', color: '#374151' }}>
              Avg Distress: <strong style={{ color: '#ef4444' }}>{today.avgDistressScore}/100</strong>
            </div>
          )}
          {today.lastInteractionAt && (
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Last interaction: {fmtTime(today.lastInteractionAt)}
            </div>
          )}
          {today.selfReportedFeeling ? (
            <div style={{ marginTop: '0.25rem', padding: '0.4rem 0.6rem', background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
              <span style={{ color: '#64748b' }}>Self-report: </span>
              <strong style={{ color: FEELING_COLOR[today.selfReportedFeeling] || '#374151' }}>
                {FEELING_ICONS[today.selfReportedFeeling] || today.selfReportedFeeling}
              </strong>
              {today.selfReportedAt && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  Submitted: {fmtTime(today.selfReportedAt)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No self-report today</div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
            No chatbot analysis available today
          </div>
          {today?.selfReportedFeeling && (
            <div style={{ marginTop: '0.75rem', padding: '0.4rem 0.6rem', background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
              <span style={{ color: '#64748b' }}>Self-report: </span>
              <strong style={{ color: FEELING_COLOR[today.selfReportedFeeling] || '#374151' }}>
                {FEELING_ICONS[today.selfReportedFeeling] || today.selfReportedFeeling}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TimeOfDayWidget({ timeOfDay }) {
  const periods = [
    { key: 'morning', label: 'Morning', icon: '🌅', range: '5:00 – 11:59' },
    { key: 'afternoon', label: 'Afternoon', icon: '☀️', range: '12:00 – 17:59' },
    { key: 'evening', label: 'Evening', icon: '🌆', range: '18:00 – 23:59' },
    { key: 'night', label: 'Night', icon: '🌙', range: '00:00 – 04:59' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
      {periods.map(({ key, label, icon, range }) => {
        const data = timeOfDay?.[key];
        const bs = data?.avgDistressScore != null ? (BAND_STYLES[
          data.avgDistressScore >= 75 ? 'Severe' : data.avgDistressScore >= 50 ? 'High' : data.avgDistressScore >= 25 ? 'Moderate' : 'Low'
        ] || BAND_STYLES.Low) : null;

        return (
          <div key={key} style={{
            background: data ? (bs?.bg || '#f8fafc') : '#f8fafc',
            border: `1px solid ${data ? (bs?.border || '#e2e8f0') : '#e2e8f0'}`,
            borderRadius: 8, padding: '1rem',
          }}>
            <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
              {icon} {label}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{range}</div>
            {data ? (
              <>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: bs?.text || '#374151' }}>
                  {data.avgDistressScore != null ? `${data.avgDistressScore}/100` : 'N/A'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>
                  {EMOTION_ICONS[data.dominantEmotion] || data.dominantEmotion || 'N/A'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                  {data.count} interaction{data.count !== 1 ? 's' : ''}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No activity</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TodayActivityCard({ today }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Today&apos;s Activity
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Chat interactions</span>
          <strong>{today?.interactionCount ?? 0}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Last interaction</span>
          <strong>{today?.lastInteractionAt ? fmtTime(today.lastInteractionAt) : 'None today'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Crisis signals</span>
          <strong style={{ color: (today?.crisisMessageCount ?? 0) > 0 ? '#b91c1c' : '#15803d' }}>
            {(today?.crisisMessageCount ?? 0) > 0 ? `⚠ ${today.crisisMessageCount} detected` : '✓ None'}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Self-report</span>
          <strong style={{ color: today?.selfReportedFeeling ? FEELING_COLOR[today.selfReportedFeeling] || '#374151' : '#94a3b8' }}>
            {today?.selfReportedFeeling ? (FEELING_ICONS[today.selfReportedFeeling] || today.selfReportedFeeling) : 'Not submitted'}
          </strong>
        </div>
      </div>
    </div>
  );
}

function AlertsPanel({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: '1.25rem', color: '#64748b', textAlign: 'center', fontSize: '0.88rem' }}>
        ✓ No open alerts for this victim
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {alerts.map((alert) => {
        const ss = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.MEDIUM;
        return (
          <div key={alert._id} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
          }}>
            <span style={{
              background: ss.bg, color: ss.text, borderRadius: 4, padding: '0.15rem 0.5rem',
              fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {alert.severity}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', marginBottom: 2 }}>
                {alert.alertType}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569' }}>{alert.description}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                {fmtDateTime(alert.createdAt)} · Status: {alert.status}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmotionBreakdownBars({ breakdown }) {
  if (!breakdown) return <div style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No emotion data</div>;
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0) || 1;
  const COLOR_MAP = {
    Fearful: '#ef4444', Angry: '#f97316', Anxious: '#eab308',
    Sad: '#6366f1', Neutral: '#64748b', Calm: '#22c55e', Hopeful: '#3b82f6',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {Object.entries(breakdown).map(([name, count]) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569', marginBottom: 2 }}>
              <span>{EMOTION_ICONS[name] || name}</span>
              <span>{pct}% ({count})</span>
            </div>
            <div style={{ height: 7, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: COLOR_MAP[name] || '#64748b', borderRadius: 4 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function VictimProfile() {
  const { id } = useParams();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [staleWarning, setStaleWarning] = useState(false);
  const timerRef = useRef(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!id) {
      setError('No victim ID provided.');
      setLoading(false);
      return;
    }
    if (isRefresh) {
      setRefreshing(true);
      setStaleWarning(false);
    } else {
      setLoading(true);
      setError('');
    }
    try {
      const res = await api.get(`/counselor/victims/${id}/dashboard`);
      setDashData(res.data.data);
      setLastUpdated(new Date());
      setError('');
      setStaleWarning(false);
    } catch (err) {
      const status = err.response?.status;
      if (!isRefresh) {
        if (status === 403) setError('You are not authorized to view this victim\'s dashboard.');
        else if (status === 404) setError('Victim not found.');
        else setError(err.response?.data?.message || 'Failed to load dashboard. Please try again.');
      } else {
        // Failed refresh — keep existing data, show stale warning
        setStaleWarning(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDashboard(false);
    timerRef.current = setInterval(() => fetchDashboard(true), REFRESH_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchDashboard]);

  const d = dashData;
  const currentStatus = d?.currentStatus;
  const today = d?.today;
  const hasCrisis = currentStatus?.crisisActive;
  const bandStyle = currentStatus?.distressBand ? (BAND_STYLES[currentStatus.distressBand] || BAND_STYLES.Low) : null;

  if (loading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
          <Link to="/counselor/victims" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>← My Victims</Link>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
          <div style={{ fontWeight: 600 }}>Loading mental health dashboard...</div>
        </div>
      </div>
    );
  }

  if (error && !d) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <Link to="/counselor/victims" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>← My Victims</Link>
        <div style={{ marginTop: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '1.25rem', color: '#991b1b', fontWeight: 500 }}>
          {error}
        </div>
      </div>
    );
  }

  const victimName = d?.victim?.name || 'Assigned Victim';
  const caseId = d?.caseInfo?.caseId || d?.caseInfo?.category || null;

  return (
    <div style={{ padding: '1rem' }}>
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{
        background: '#eef2fb',
        border: '1px solid #d1d5db',
        borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.25rem', color: '#1a1a2e',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <Link to="/counselor/victims" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
              ← My Victims
            </Link>
            <h1 style={{ margin: '0.35rem 0 0 0', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.02em', color: '#1a1a2e' }}>
              🧠 VICTIM MENTAL HEALTH ANALYSIS
            </h1>
            <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#4b5563', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontWeight: 500 }}>
              <span>👤 {victimName}</span>
              {caseId && <span>📋 Case: {caseId}</span>}
              <span>📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#4b5563' }}>
            {refreshing && <div style={{ color: '#2563eb', marginBottom: 2 }}>🔄 Refreshing...</div>}
            {staleWarning && <div style={{ color: '#d97706', marginBottom: 2 }}>⚠ Unable to refresh</div>}
            {lastUpdated && (
              <div>Last updated: {fmtTime(lastUpdated)}</div>
            )}
            <div style={{ marginTop: 2, color: '#6b7280' }}>Auto-refresh: 60s</div>
            {bandStyle && (
              <div style={{ marginTop: '0.5rem', background: bandStyle.bg, color: bandStyle.text, border: `1px solid ${bandStyle.border}`, borderRadius: 20, padding: '0.25rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, display: 'inline-block' }}>
                {bandStyle.label} RISK
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CRISIS BANNER ─────────────────────────────────────── */}
      {hasCrisis && <CrisisBanner />}

      {/* ── STALE DATA WARNING ─────────────────────────────────── */}
      {staleWarning && lastUpdated && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e' }}>
          Unable to refresh. Showing data from {fmtTime(lastUpdated)}.
        </div>
      )}

      {/* ── ROW 1: Trend Chart | Overall Risk | Today Emotion ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px 240px', gap: '1rem', marginBottom: '1rem' }}>
        {/* Distress Trend */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📈 Day-Wise Distress Trend (30 Days)
          </h3>
          <DistressTrendChart dailyTrend={d?.dailyTrend || []} />
          {d?.dailyTrend?.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
              Based on {d.dailyTrend.reduce((s, day) => s + day.messageCount, 0)} messages across {d.dailyTrend.length} day{d.dailyTrend.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Overall Risk Level */}
        <RiskLevelCard status={currentStatus} />

        {/* Today's Emotion */}
        <TodayEmotionCard today={today} />
      </div>

      {/* ── ROW 2: Time of Day ─────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🕐 Day-Time Emotion & Distress Levels (Today, IST)
        </h3>
        {today && today.interactionCount > 0 ? (
          <TimeOfDayWidget timeOfDay={d?.timeOfDay} />
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '0.88rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
            No chatbot interactions recorded today — time-of-day breakdown unavailable.
          </div>
        )}
      </div>

      {/* ── ROW 3: Today Activity | Alerts | Emotion Breakdown ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <TodayActivityCard today={today} />

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🔔 Open Alerts ({d?.alerts?.length ?? 0})
          </h3>
          <AlertsPanel alerts={d?.alerts} />
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📊 Lifetime Emotion Breakdown
          </h3>
          <EmotionBreakdownBars breakdown={currentStatus?.emotionsBreakdown} />
          {currentStatus?.emotionsBreakdown && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
              Cumulative totals across all chatbot sessions
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 4: Victim Profile & Case Info ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            👤 Victim Profile
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
            {[
              ['Name', d?.victim?.name],
              ['Gender', d?.victim?.gender],
              ['Phone', d?.victim?.phone],
              ['District', d?.victim?.district],
              ['State', d?.victim?.state],
              ['PIN Code', d?.victim?.pinCode],
              ['Social Category', d?.victim?.socialCategory],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{display(val)}</div>
              </div>
            ))}
            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>Address</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{display(d?.victim?.address)}</div>
            </div>
          </div>

          {(d?.victim?.userId?.profileImage || d?.victim?.profileImage) && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Victim Image</div>
              <img
                src={`http://localhost:5000${d.victim.userId?.profileImage || d.victim.profileImage}`}
                alt="Victim"
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📋 Case Information
          </h3>
          {d?.caseInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              {[
                ['Case ID', d.caseInfo.caseId],
                ['Category', d.caseInfo.category],
                ['Status', d.caseInfo.status],
                ['Assigned', d.caseInfo.assignedAt ? fmtDate(d.caseInfo.assignedAt) : null],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <strong style={{ color: '#1e293b' }}>{display(val)}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Chat Sessions</span>
                <strong style={{ color: '#1e293b' }}>{d?.sessionCount ?? 0}</strong>
              </div>
              {d.caseInfo.firDetails?.firNumber && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 600 }}>FIR Details</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>FIR Number</span>
                      <strong style={{ color: '#1e293b' }}>{display(d.caseInfo.firDetails.firNumber)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Police Station</span>
                      <strong style={{ color: '#1e293b' }}>{display(d.caseInfo.firDetails.policeStation)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>FIR District</span>
                      <strong style={{ color: '#1e293b' }}>{display(d.caseInfo.firDetails.firDistrict)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>FIR State</span>
                      <strong style={{ color: '#1e293b' }}>{display(d.caseInfo.firDetails.firState)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.88rem', fontStyle: 'italic' }}>No case information available</div>
          )}
        </div>
      </div>

      {/* ── FOOTER: Disclaimer ─────────────────────────────────── */}
      <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
        <strong>Note:</strong> All metrics shown are AI-derived monitoring indicators based on chatbot interactions and self-reports.
        They are not clinical diagnoses. Counselor intervention should be based on professional judgment.
        Raw chatbot conversation content is not displayed in this dashboard.
      </div>
    </div>
  );
}
