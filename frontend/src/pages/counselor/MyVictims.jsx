import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { RiskBadge, fmtDateTime } from '../../components/counselor/CounselorCommon';
import { useLanguage } from '../../context/LanguageContext';

export default function MyVictims() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [victims, setVictims] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;

    const fetchVictims = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/counselor/victims');
        if (mounted) {
          setVictims(response.data.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || (language === 'hi' ? 'पीड़ितों को लोड करने में विफल।' : 'Failed to load assigned victims.'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVictims();

    return () => {
      mounted = false;
    };
  }, [language]);

  const filteredVictims = victims.filter((v) => {
    const name = (v.name || '').toLowerCase();
    const caseId = (v.caseId || '').toLowerCase();
    const district = (v.district || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || name.includes(q) || caseId.includes(q) || district.includes(q);

    const score = v.distressAnalysis?.distressScore ?? 20;
    const band = v.distressAnalysis?.distressBand || 'Low';

    let matchesFilter = true;
    if (filter === 'HIGH RISK') {
      matchesFilter = score >= 50 || band === 'High' || band === 'Severe';
    } else if (filter === 'MODERATE RISK') {
      matchesFilter = (score >= 25 && score < 50) || band === 'Moderate';
    } else if (filter === 'LOW RISK') {
      matchesFilter = score < 25 || band === 'Low';
    }

    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { key: 'ALL', label: t('filterAll') },
    { key: 'HIGH RISK', label: t('filterHighRisk') },
    { key: 'MODERATE RISK', label: t('filterModerateRisk') },
    { key: 'LOW RISK', label: t('filterLowRisk') },
  ];

  return (
    <div className="counselor-page" style={{ padding: '1rem', backgroundColor: '#f5f6fa', minHeight: '100%' }}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
            {t('myVictimsTitle')}
          </h1>
          <p style={{ color: '#4b5563', margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            {t('myVictimsSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              backgroundColor: '#eef2fb',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            👥 {victims.length} {t('totalAssigned')}
          </span>
        </div>
      </header>

      {/* ── Search & Filter Controls ────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.25rem',
              fontSize: '0.85rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#1a1a2e',
              boxSizing: 'border-box',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.9rem',
              color: '#9ca3af',
            }}
          >
            🔍
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginRight: 4 }}>
            {t('filterLabel')}
          </span>
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                backgroundColor: filter === f.key ? '#2563eb' : '#ffffff',
                color: filter === f.key ? '#ffffff' : '#475569',
                border: `1px solid ${filter === f.key ? '#2563eb' : '#d1d5db'}`,
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⏳</div>
          <div style={{ fontWeight: 600 }}>
            {language === 'hi' ? 'पीड़ित प्रोफ़ाइल लोड हो रही हैं...' : 'Loading assigned victim profiles...'}
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            color: '#991b1b',
            backgroundColor: '#fdecec',
            border: '1px solid #fca5a5',
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Victims Grid ────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {filteredVictims.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '3rem 2rem',
                border: '1px dashed #cbd5e1',
                borderRadius: '10px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1.05rem' }}>
                {t('noVictimsFound')}
              </div>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>
                {searchQuery || filter !== 'ALL'
                  ? t('noVictimsDesc')
                  : (language === 'hi' ? 'वर्तमान में आपके केसलोड में कोई पीड़ित नहीं है।' : 'You have no victims currently assigned to your caseload.')}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filteredVictims.map((victim) => {
                const analysis = victim.distressAnalysis || {};
                const band = analysis.distressBand || 'Low';
                const score = analysis.distressScore ?? 20;
                const caseLabel = victim.caseId || (victim._id ? `ARH-${victim._id.toString().slice(-4).toUpperCase()}` : 'ARH-2026-001');
                const lastInteraction = victim.lastInteractionAt || analysis.updatedAt || victim.assignedAt;

                return (
                  <article
                    key={victim._id || victim.victimId}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'box-shadow 0.2s ease',
                    }}
                  >
                    <div>
                      {/* Top Row: Name + Case ID & Risk Badge */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <div>
                          <h2
                            style={{
                              margin: 0,
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              color: '#1a1a2e',
                              lineHeight: 1.25,
                            }}
                          >
                            {victim.name || (language === 'hi' ? 'सौंपा गया पीड़ित' : 'Assigned Victim')}
                          </h2>
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: '#64748b',
                              marginTop: 3,
                              fontWeight: 600,
                            }}
                          >
                            {t('caseId')} <span style={{ color: '#2563eb' }}>{caseLabel}</span>
                          </div>
                        </div>

                        <RiskBadge band={band} score={score} />
                      </div>

                      {/* Card Body Details */}
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #eef2f6',
                          padding: '0.75rem',
                          fontSize: '0.82rem',
                          color: '#475569',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>{t('lastInteraction')}</span>
                          <strong style={{ color: '#1a1a2e' }}>{fmtDateTime(lastInteraction)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>{t('location')}</span>
                          <span style={{ color: '#1a1a2e', fontWeight: 500 }}>
                            {victim.district || 'District'}, {victim.state || 'State'}
                          </span>
                        </div>
                        {victim.phone && victim.phone !== 'N/A' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>{t('contact')}</span>
                            <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{victim.phone}</span>
                          </div>
                        )}
                        {victim.category && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>{t('supportType')}</span>
                            <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{victim.category}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => navigate(`/counselor/victims/${victim._id || victim.victimId}`)}
                      style={{
                        marginTop: '0.5rem',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.65rem 1rem',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {t('viewProfile')}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
