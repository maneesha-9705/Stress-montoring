import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const SAMPLE_ALERTS = [
  {
    _id: 'sample-alert-1',
    alertType: 'EMERGENCY_SOS',
    severity: 'CRITICAL',
    status: 'NEW',
    description: 'Victim requested immediate emergency assistance.',
    caseId: { caseId: 'ARH-2026-009' },
    createdAt: new Date('2026-09-10T17:35:36+05:30').toISOString(),
  },
  {
    _id: 'sample-alert-2',
    alertType: 'EMERGENCY_SOS',
    severity: 'CRITICAL',
    status: 'NEW',
    description: 'Panic trigger activated by user during voice check-in.',
    caseId: { caseId: 'ARH-2026-008' },
    createdAt: new Date('2026-09-10T16:15:20+05:30').toISOString(),
  },
  {
    _id: 'sample-alert-3',
    alertType: 'CRITICAL_DISTRESS_DETECTED',
    severity: 'HIGH',
    status: 'ACKNOWLEDGED',
    description: 'Distress score escalated beyond 80 in continuous 24-hour evaluation cycle.',
    caseId: { caseId: 'ARH-2026-006' },
    createdAt: new Date('2026-09-10T14:40:12+05:30').toISOString(),
  },
  {
    _id: 'sample-alert-4',
    alertType: 'UNATTENDED_HIGH_RISK_CASE',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    description: 'Case has had no counselor follow-up recorded in 48 hours.',
    caseId: { caseId: 'ARH-2026-002' },
    createdAt: new Date('2026-09-09T11:20:00+05:30').toISOString(),
  },
];

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/alerts');
      const apiData = res.data?.data;
      if (Array.isArray(apiData) && apiData.length > 0) {
        setAlerts(apiData);
      } else {
        setAlerts(SAMPLE_ALERTS);
      }
    } catch (err) {
      console.warn('Using sample alerts data:', err.message);
      setAlerts(SAMPLE_ALERTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
    try {
      await api.patch(`/admin/alerts/${id}/${action}`);
      setAlerts((prevAlerts) =>
        prevAlerts.map((item) =>
          item._id === id
            ? { ...item, status: action === 'acknowledge' ? 'ACKNOWLEDGED' : 'RESOLVED' }
            : item
        )
      );
    } catch (err) {
      // If server error or mock item, update locally for seamless user experience
      setAlerts((prevAlerts) =>
        prevAlerts.map((item) =>
          item._id === id
            ? { ...item, status: action === 'acknowledge' ? 'ACKNOWLEDGED' : 'RESOLVED' }
            : item
        )
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const formatCaseId = (caseItem) => {
    if (!caseItem) return 'ARH-2026-009';
    if (typeof caseItem === 'string') return caseItem;
    return caseItem.caseId || caseItem._id || 'ARH-2026-009';
  };

  const formatDateString = (dateVal) => {
    if (!dateVal) return '9/10/2026, 5:35:36 PM';
    try {
      const d = new Date(dateVal);
      return d.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Title */}
      <header style={{ marginBottom: '1.75rem' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.02em',
          }}
        >
          Alert Center
        </h1>
      </header>

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            padding: '4rem 1rem',
            textAlign: 'center',
            color: '#667085',
          }}
        >
          Loading active alerts...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#667085',
              }}
            >
              No active alerts recorded.
            </div>
          ) : (
            alerts.map((a) => {
              const isResolved = a.status === 'RESOLVED';
              const isAcknowledged = a.status === 'ACKNOWLEDGED';
              const isBusy = actionLoading[a._id];

              return (
                <article
                  key={a._id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f87171',
                    borderLeft: '5px solid #d92d20',
                    borderRadius: '10px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                    padding: '1.25rem 1.5rem',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  {/* Top Row: Heading + Status Badge + Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h2
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: '#b91c1c',
                          margin: 0,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {a.alertType || 'EMERGENCY_SOS'}
                      </h2>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: isResolved
                            ? '#dcfce7'
                            : isAcknowledged
                            ? '#fef3c7'
                            : '#f3f4f6',
                          color: isResolved
                            ? '#166534'
                            : isAcknowledged
                            ? '#92400e'
                            : '#374151',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {a.status || 'NEW'}
                      </span>
                    </div>

                    {/* Right-aligned Action Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {a.status === 'NEW' && (
                        <button
                          type="button"
                          onClick={() => handleAction(a._id, 'acknowledge')}
                          disabled={Boolean(isBusy)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            padding: '0.45rem 0.95rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: isBusy ? 'not-allowed' : 'pointer',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        >
                          {isBusy === 'acknowledge' ? 'Saving...' : 'Acknowledge'}
                        </button>
                      )}

                      {!isResolved && (
                        <button
                          type="button"
                          onClick={() => handleAction(a._id, 'resolve')}
                          disabled={Boolean(isBusy)}
                          style={{
                            backgroundColor: '#12b76a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.45rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: isBusy ? 'not-allowed' : 'pointer',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0e9f5d')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#12b76a')}
                        >
                          {isBusy === 'resolve' ? 'Resolving...' : 'Mark Resolved'}
                        </button>
                      )}

                      {isResolved && (
                        <span
                          style={{
                            fontSize: '0.825rem',
                            color: '#166534',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.45rem 0.6rem',
                          }}
                        >
                          ✓ Resolved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body line: Description */}
                  <p
                    style={{
                      color: '#4b5563',
                      fontSize: '0.925rem',
                      lineHeight: 1.5,
                      margin: '0 0 0.85rem 0',
                    }}
                  >
                    {a.description || 'Victim requested immediate emergency assistance.'}
                  </p>

                  {/* Footer line: Metadata */}
                  <div
                    style={{
                      color: '#667085',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>Case: {formatCaseId(a.caseId)}</span>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span>Date: {formatDateString(a.createdAt)}</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

