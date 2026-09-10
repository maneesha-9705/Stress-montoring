import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BAND_STYLES, EMOTION_ICONS } from '../counselor/CounselorCommon';

export default function PowerBiDistressDashboard({ analytics, victims = [], selectedFilter, onFilterChange }) {
  const navigate = useNavigate();

  const {
    totalVictims = 0,
    avgDistressScore = 20,
    overallBand = 'Low',
    highRiskCount = 0,
    moderateRiskCount = 0,
    lowRiskCount = 0,
    combinedEmotions = {}
  } = analytics || {};

  const normalizedBand = overallBand ? (overallBand.charAt(0).toUpperCase() + overallBand.slice(1).toLowerCase()) : 'Low';
  const bandStyle = BAND_STYLES[normalizedBand] || BAND_STYLES.Low;
  const totalEmotionsCount = Object.values(combinedEmotions).reduce((a, b) => a + b, 0) || 1;

  // Find dominant emotion across all victims
  let dominantEmotion = 'Calm';
  let maxCount = -1;
  Object.entries(combinedEmotions).forEach(([e, cnt]) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      dominantEmotion = e;
    }
  });

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', color: '#1a1a2e', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
      {/* 1. TOP NAVIGATION & HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde047', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem' }}>
            ANALYTICS
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1a1a2e' }}>
              CASELOAD PSYCHOLOGICAL DISTRESS OVERVIEW
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Aggregated psychological metrics &amp; distress indicators for assigned victims
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#15803d', backgroundColor: '#f0fdf4', padding: '0.3rem 0.65rem', borderRadius: '9999px', border: '1px solid #bbf7d0', fontWeight: 700 }}>
            🟢 LIVE METRICS
          </span>
        </div>
      </div>

      {/* 2. KPI CARDS TILE ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* KPI 1: Total Victims */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>TOTAL ASSIGNED VICTIMS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a1a2e', marginTop: '0.25rem' }}>{totalVictims}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Caseload</span>
        </div>

        {/* KPI 2: Overall Distress Score Index */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0', borderLeft: `4px solid ${bandStyle.bar}` }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>OVERALL DISTRESS INDEX</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: bandStyle.text, marginTop: '0.25rem' }}>
            {avgDistressScore} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ 100</span>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: bandStyle.text, backgroundColor: bandStyle.bg, border: `1px solid ${bandStyle.border}`, padding: '2px 8px', borderRadius: '9999px', display: 'inline-block', marginTop: '2px' }}>
            {bandStyle.label} RISK
          </span>
        </div>

        {/* KPI 3: High Risk Count */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>HIGH RISK VICTIMS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b91c1c', marginTop: '0.25rem' }}>{highRiskCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Require Urgent Follow-Up</span>
        </div>

        {/* KPI 4: Dominant Emotion */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>DOMINANT EMOTION</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6b21a8', marginTop: '0.5rem' }}>
            {EMOTION_ICONS[dominantEmotion] || dominantEmotion}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Most Frequent Emotional State</span>
        </div>
      </div>

      {/* 3. VISUALS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Visual A: Victim Distress Comparative Bar Chart */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊</span> INDIVIDUAL VICTIM DISTRESS RANKING
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
            {victims.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No victim records found.</div>
            ) : (
              victims.map((v) => {
                const score = v.distressAnalysis?.distressScore || 20;
                const band = v.distressAnalysis?.distressBand || 'Low';
                const bStyle = BAND_STYLES[band] || BAND_STYLES.Low;

                return (
                  <div
                    key={v._id || v.victimId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/counselor/victims/${v._id || v.victimId}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        {v.name} <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({v.district || 'District'})</span>
                      </span>
                      <span style={{ fontWeight: 700, color: bStyle.text }}>{score}/100</span>
                    </div>
                    <div style={{ height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(5, score))}%`,
                          height: '100%',
                          backgroundColor: bStyle.bar,
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Visual B: Caseload Emotional Breakdown Chart */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🍩</span> CASELOAD EMOTION DISTRIBUTION
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {Object.entries(combinedEmotions).map(([eName, count]) => {
              const pct = Math.round((count / totalEmotionsCount) * 100);
              return (
                <div key={eName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px', color: '#475569' }}>
                    <span>{EMOTION_ICONS[eName] || eName}</span>
                    <span>{pct}% ({count})</span>
                  </div>
                  <div style={{ height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: eName === 'Fearful' || eName === 'Angry' ? '#ef4444' : eName === 'Anxious' || eName === 'Sad' ? '#f97316' : '#3b82f6',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. RISK LEVEL FILTER BAR */}
      {onFilterChange && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>Filter View:</span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['ALL', 'HIGH RISK', 'MODERATE RISK', 'LOW RISK'].map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                style={{
                  backgroundColor: selectedFilter === f ? '#2563eb' : '#ffffff',
                  color: selectedFilter === f ? '#ffffff' : '#475569',
                  border: `1px solid ${selectedFilter === f ? '#2563eb' : '#d1d5db'}`,
                  borderRadius: '6px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
