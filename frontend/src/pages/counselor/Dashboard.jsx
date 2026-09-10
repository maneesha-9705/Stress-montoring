import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import PowerBiDistressDashboard from '../../components/charts/PowerBiDistressDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignedCases, setAssignedCases] = useState([]);
  const [victims, setVictims] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const res = await api.get('/counselor/profile');
        if (mounted) {
          setProfile(res.data.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Unable to load counselor profile');
        }
      }
    };

    const fetchAssignedCases = async () => {
      try {
        setLoading(true);
        const response = await api.get('/counselor/assigned-cases');
        if (mounted) {
          setAssignedCases(response.data.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Unable to load assigned cases');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const fetchVictimsAnalytics = async () => {
      try {
        const res = await api.get('/counselor/victims');
        if (mounted) {
          setVictims(res.data.data || []);
          setAnalytics(res.data.overallAnalytics || null);
        }
      } catch (err) {
        console.warn('Victims analytics fetch fallback:', err.message);
      }
    };

    fetchProfile();
    fetchAssignedCases();
    fetchVictimsAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Welcome, {profile?.name || 'Counselor'}</h1>
          <p style={{ color: '#4b5563', margin: '0.25rem 0 0 0' }}>Overview of assigned victim cases &amp; Power BI psychological distress metrics.</p>
        </div>

        <Link
          to="/counselor/victims"
          style={{ backgroundColor: '#2563eb', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}
        >
          👤 View All Assigned Victims ({victims.length}) &rarr;
        </Link>
      </header>

      {loading && <div style={{ padding: '1.5rem', color: '#64748b' }}>Loading counselor workspace...</div>}
      {error && <div style={{ color: 'crimson', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

      {!loading && (
        <>
          {/* POWER BI DISTRESS SCORE ANALYTICS BOARD */}
          <PowerBiDistressDashboard analytics={analytics} victims={victims} />

          {/* MY ASSIGNED CASES SECTION */}
          <section style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>MY ASSIGNED CASES ({assignedCases.length})</h2>

            {assignedCases.length === 0 ? (
              <div className="empty-state-card" style={{ color: '#6b7280', padding: '1rem' }}>
                No cases have been assigned to you yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {assignedCases.map((caseItem) => (
                  <article key={caseItem._id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '1rem', background: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#111827' }}>CASE ID: #{caseItem.caseId || caseItem._id}</div>
                        <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>REQUEST TYPE: {caseItem.category || 'Request Type'}</div>
                        <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>STATUS: Assigned</div>
                        <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>ASSIGNED DATE: {caseItem.assignedAt ? new Date(caseItem.assignedAt).toLocaleDateString() : 'N/A'}</div>
                        <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>VICTIM REQUEST: {caseItem.description || 'No description provided'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {caseItem.victimId && (
                          <button
                            type="button"
                            onClick={() => navigate(`/counselor/victims/${caseItem.victimId?._id || caseItem.victimId}`)}
                            style={{ backgroundColor: '#ffffff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.65rem 0.9rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            VICTIM PROFILE
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (caseItem?._id) {
                              navigate(`/counselor/case-report/${caseItem._id}`);
                            }
                          }}
                          style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.65rem 0.9rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          VIEW CASE &rarr;
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
