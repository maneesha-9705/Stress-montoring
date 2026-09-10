import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

const BAND_THRESHOLDS = [
  { y: 75, label: 'Severe', color: '#ef4444' },
  { y: 50, label: 'High', color: '#f97316' },
  { y: 25, label: 'Moderate', color: '#eab308' },
];

const getDistressColor = (score) => {
  if (score == null) return '#64748b';
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 25) return '#eab308';
  return '#22c55e';
};

const EMOTION_ICONS = {
  Fearful: '😨', Anxious: '😟', Sad: '😢', Angry: '😠',
  Calm: '😌', Hopeful: '🌟', Neutral: '😐',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1a1a2e', minWidth: 170,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#2563eb' }}>{label}</div>
      {d.avgDistressScore != null ? (
        <div style={{ color: getDistressColor(d.avgDistressScore), fontWeight: 600 }}>
          Distress Score: <strong>{d.avgDistressScore}/100</strong>
        </div>
      ) : (
        <div style={{ color: '#64748b', fontStyle: 'italic' }}>No analysis data</div>
      )}
      <div style={{ color: '#475569', marginTop: 2 }}>Messages: <strong>{d.messageCount ?? 0}</strong></div>
      {d.dominantEmotion && (
        <div style={{ color: '#475569', marginTop: 2 }}>Emotion: <strong>{EMOTION_ICONS[d.dominantEmotion] || ''} {d.dominantEmotion}</strong></div>
      )}
      {d.crisisCount > 0 && (
        <div style={{ color: '#b91c1c', marginTop: 4, fontWeight: 700 }}>⚠ Crisis signals: <strong>{d.crisisCount}</strong></div>
      )}
    </div>
  );
};

const CustomDot = ({ cx, cy, payload }) => {
  if (!payload || payload.avgDistressScore == null) return null;
  const color = getDistressColor(payload.avgDistressScore);
  const hasCrisis = payload.crisisCount > 0;
  return (
    <g>
      <circle cx={cx} cy={cy} r={hasCrisis ? 7 : 4} fill={color} stroke="#ffffff" strokeWidth={2} />
      {hasCrisis && <circle cx={cx} cy={cy} r={11} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2" />}
    </g>
  );
};

/**
 * DistressTrendChart — 30-day area chart of avgDistressScore from real ChatMessage metadata.
 * Missing days are shown as gaps (null values) rather than fake zeros.
 */
export default function DistressTrendChart({ dailyTrend }) {
  if (!dailyTrend || dailyTrend.length === 0) {
    return (
      <div style={{
        background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8,
        padding: '3rem 2rem', textAlign: 'center', color: '#64748b',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
        <div style={{ fontWeight: 600 }}>No trend data available</div>
        <div style={{ fontSize: '0.82rem', marginTop: 4 }}>
          Trend data appears once this victim begins chatbot interactions.
        </div>
      </div>
    );
  }

  // Format X-axis label
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={dailyTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="distressGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date" tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickCount={6}
            label={{ value: 'Distress', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#94a3b8' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          {BAND_THRESHOLDS.map((t) => (
            <ReferenceLine
              key={t.label} y={t.y} stroke={t.color} strokeDasharray="4 3" strokeWidth={1}
              label={{ value: t.label, position: 'right', fontSize: 10, fill: t.color }}
            />
          ))}
          <Area
            type="monotone" dataKey="avgDistressScore"
            stroke="#ef4444" strokeWidth={2}
            fill="url(#distressGrad)"
            connectNulls={false}
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748b', justifyContent: 'center' }}>
        {BAND_THRESHOLDS.map((t) => (
          <span key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 3, background: t.color, display: 'inline-block', borderRadius: 2 }} />
            {t.label} ({t.y}+)
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 3, background: '#22c55e', display: 'inline-block', borderRadius: 2 }} />
          Low ({'<'}25)
        </span>
      </div>
    </div>
  );
}
