import React from 'react';

// ── Shared Constants & Styles ──────────────────────────────────
export const BAND_STYLES = {
  Low:      { bg: '#f6fbf8', text: '#15803d', border: '#bbf7d0', bar: '#22c55e', label: 'LOW' },
  Moderate: { bg: '#fff8e6', text: '#c2410c', border: '#fde047', bar: '#eab308', label: 'MODERATE' },
  High:     { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', bar: '#f43f5e', label: 'HIGH' },
  Severe:   { bg: '#fdecec', text: '#b91c1c', border: '#fca5a5', bar: '#ef4444', label: 'SEVERE' },
};

export const SEVERITY_STYLES = {
  LOW:      { bg: '#f6fbf8', text: '#15803d' },
  MEDIUM:   { bg: '#fff8e6', text: '#c2410c' },
  HIGH:     { bg: '#fff1f2', text: '#be123c' },
  CRITICAL: { bg: '#fdecec', text: '#b91c1c' },
};

export const EMOTION_ICONS = {
  Fearful: '😨 Fearful',
  Anxious: '😟 Anxious',
  Sad: '😢 Sad',
  Angry: '😠 Angry',
  Calm: '😌 Calm',
  Hopeful: '🌟 Hopeful',
  Neutral: '😐 Neutral',
};

export const FEELING_ICONS = {
  'Very good': '😄 Very Good',
  Good: '🙂 Good',
  Okay: '😐 Okay',
  Bad: '😟 Bad',
  'Very bad': '😢 Very Bad',
};

export const FEELING_COLOR = {
  'Very good': '#15803d',
  Good: '#0284c7',
  Okay: '#78716c',
  Bad: '#c2410c',
  'Very bad': '#b91c1c',
};

// ── Shared Helper formatters ───────────────────────────────────
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

export const fmtDateTime = (d) =>
  d ? `${fmtDate(d)} ${fmtTime(d)}` : 'N/A';

export const display = (v) => (v != null && v !== '' ? v : 'N/A');

// ── Shared Sub-components ──────────────────────────────────────

/**
 * RiskBadge — Small pill colored by severity (LOW, MODERATE, HIGH, SEVERE)
 */
export function RiskBadge({ band = 'Low', score = null, style = {} }) {
  const normalizedBand = band ? (band.charAt(0).toUpperCase() + band.slice(1).toLowerCase()) : 'Low';
  const bs = BAND_STYLES[normalizedBand] || BAND_STYLES.Low;

  return (
    <span
      style={{
        backgroundColor: bs.bg,
        color: bs.text,
        border: `1px solid ${bs.border}`,
        borderRadius: '9999px',
        padding: '0.2rem 0.65rem',
        fontSize: '0.74rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: bs.bar,
          display: 'inline-block',
        }}
      />
      {bs.label} RISK {score != null ? `(${score})` : ''}
    </span>
  );
}

/**
 * CrisisBanner — Light red alert banner for crises or overdue follow-ups
 */
export function CrisisBanner({
  title = 'CRISIS SIGNAL DETECTED — TODAY',
  message = 'One or more of today\'s chatbot interactions triggered an AI-detected crisis signal. Please contact the victim directly and assess their current wellbeing.',
  icon = '🚨',
  style = {},
}) {
  return (
    <div
      style={{
        background: '#fdecec',
        border: '1px solid #ef4444',
        borderRadius: 10,
        padding: '0.85rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.08)',
        ...style,
      }}
    >
      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.95rem', letterSpacing: '0.02em' }}>
          {title}
        </div>
        <div style={{ color: '#b91c1c', fontSize: '0.84rem', marginTop: 3, lineHeight: 1.4 }}>
          {message}
        </div>
      </div>
    </div>
  );
}

/**
 * TodayEmotionCard — Standardized Today's Emotion / Self-report card
 */
export function TodayEmotionCard({ today, title = "Today's Emotion & Self-Report" }) {
  const hasData = today && (today.interactionCount > 0 || today.dominantEmotion);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '1.25rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <h3
          style={{
            margin: '0 0 0.75rem 0',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </h3>
        {hasData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e' }}>
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
              <div
                style={{
                  marginTop: '0.35rem',
                  padding: '0.45rem 0.65rem',
                  background: '#f8fafc',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ color: '#64748b' }}>Self-report: </span>
                <strong style={{ color: FEELING_COLOR[today.selfReportedFeeling] || '#374151' }}>
                  {FEELING_ICONS[today.selfReportedFeeling] || today.selfReportedFeeling}
                </strong>
                {today.selfReportedAt && (
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                    Submitted: {fmtTime(today.selfReportedAt)}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.25rem' }}>
                No self-report today
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ color: '#64748b', fontSize: '0.88rem', fontStyle: 'italic' }}>
              No chatbot analysis available today
            </div>
            {today?.selfReportedFeeling && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.45rem 0.65rem',
                  background: '#f8fafc',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ color: '#64748b' }}>Self-report: </span>
                <strong style={{ color: FEELING_COLOR[today.selfReportedFeeling] || '#374151' }}>
                  {FEELING_ICONS[today.selfReportedFeeling] || today.selfReportedFeeling}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
