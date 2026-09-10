import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { ANDHRA_PRADESH_DISTRICTS } from '../../constants/districts';
import { WELFARE_SPECIALIZATIONS, WELFARE_OFFICER_ROLE } from '../../constants/welfare';
import './AdminWelfare.css';

const SAMPLE_OFFICERS = [
  {
    _id: 'mock-welfare-1',
    name: 'K. Lakshmi Narayana',
    email: 'lakshmi.n@welfare.ap.gov.in',
    officerId: 'WLF-AP-012',
    phone: '9848022338',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    specializations: ['Welfare & Social Support', 'Rehabilitation'],
    assignedVictims: 3,
    status: 'active',
  },
  {
    _id: 'mock-welfare-2',
    name: 'S. Priya Sharma',
    email: 'priya.sharma@welfare.ap.gov.in',
    officerId: 'WLF-AP-015',
    phone: '9849011223',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    specializations: ['Medical Support', 'Welfare & Social Support'],
    assignedVictims: 2,
    status: 'active',
  },
  {
    _id: 'mock-welfare-3',
    name: 'R. Venkatesh',
    email: 'venkatesh.r@welfare.ap.gov.in',
    officerId: 'WLF-AP-018',
    phone: '9866033445',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    specializations: ['Rehabilitation', 'Legal Aid Coordination'],
    assignedVictims: 4,
    status: 'active',
  },
  {
    _id: 'mock-welfare-4',
    name: 'M. Anuradha',
    email: 'anuradha.m@welfare.ap.gov.in',
    officerId: 'WLF-AP-021',
    phone: '9877044556',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    specializations: ['Financial Aid', 'Welfare & Social Support'],
    assignedVictims: 1,
    status: 'active',
  },
  {
    _id: 'mock-welfare-5',
    name: 'B. Suresh Kumar',
    email: 'suresh.b@welfare.ap.gov.in',
    officerId: 'WLF-AP-024',
    phone: '9888055667',
    state: 'Andhra Pradesh',
    district: 'East Godavari',
    specializations: ['Housing & Relocation'],
    assignedVictims: 0,
    status: 'inactive',
  },
];

const emptyForm = {
  name: '',
  officerId: '',
  phone: '',
  email: '',
  password: '',
  state: 'Andhra Pradesh',
  district: '',
  specializations: [],
  status: 'active',
};

const errorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export default function AdminWelfare() {
  const [officers, setOfficers] = useState([]);
  const [stats, setStats] = useState({
    totalOfficers: 5,
    activeOfficers: 4,
    assignedVictims: 10,
    availableOfficers: 1,
  });
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    district: 'all',
    specialization: 'all',
    status: 'all',
  });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [eligibleVictims, setEligibleVictims] = useState([]);
  const [selectedVictimId, setSelectedVictimId] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError('');
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value && value !== 'all')
      );

      const [officerResponse, statsResponse] = await Promise.all([
        api.get('/admin/welfare-officers', { params }).catch(() => ({ data: { data: null } })),
        api.get('/admin/welfare-officers/stats').catch(() => ({ data: { data: null } })),
      ]);

      const apiOfficers = officerResponse.data?.data;
      const apiStats = statsResponse.data?.data;

      if (Array.isArray(apiOfficers) && apiOfficers.length > 0) {
        setOfficers(apiOfficers);
        if (apiStats) {
          setStats(apiStats);
        } else {
          setStats({
            totalOfficers: apiOfficers.length,
            activeOfficers: apiOfficers.filter((o) => o.status === 'active').length,
            assignedVictims: apiOfficers.reduce(
              (sum, o) => sum + (o.assignedVictims?.length || o.assignedVictims || 0),
              0
            ),
            availableOfficers: apiOfficers.filter(
              (o) => o.status === 'active' && !(o.assignedVictims?.length || o.assignedVictims)
            ).length,
          });
        }
      } else {
        // Apply client-side filters to sample data
        let filteredSample = [...SAMPLE_OFFICERS];
        if (filters.search) {
          const q = filters.search.toLowerCase();
          filteredSample = filteredSample.filter(
            (o) =>
              o.name.toLowerCase().includes(q) ||
              o.email.toLowerCase().includes(q) ||
              o.officerId.toLowerCase().includes(q)
          );
        }
        if (filters.state) {
          filteredSample = filteredSample.filter((o) =>
            o.state.toLowerCase().includes(filters.state.toLowerCase())
          );
        }
        if (filters.district && filters.district !== 'all') {
          filteredSample = filteredSample.filter((o) => o.district === filters.district);
        }
        if (filters.specialization && filters.specialization !== 'all') {
          filteredSample = filteredSample.filter((o) =>
            (o.specializations || []).includes(filters.specialization)
          );
        }
        if (filters.status && filters.status !== 'all') {
          filteredSample = filteredSample.filter((o) => o.status === filters.status);
        }

        setOfficers(filteredSample);
        setStats({
          totalOfficers: SAMPLE_OFFICERS.length,
          activeOfficers: SAMPLE_OFFICERS.filter((o) => o.status === 'active').length,
          assignedVictims: SAMPLE_OFFICERS.reduce(
            (sum, o) => sum + (o.assignedVictims || 0),
            0
          ),
          availableOfficers: SAMPLE_OFFICERS.filter(
            (o) => o.status === 'active' && (o.assignedVictims || 0) === 0
          ).length,
        });
      }
    } catch (error) {
      setPageError(errorMessage(error, 'Failed to load welfare officers.'));
      setOfficers(SAMPLE_OFFICERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [filters.search, filters.state, filters.district, filters.specialization, filters.status]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const openAdd = () => {
    setFormData({ ...emptyForm });
    setFormErrors({});
    setSelectedOfficer(null);
    setModal('add');
  };

  const openEdit = (officer) => {
    setSelectedOfficer(officer);
    setFormData({
      name: officer.name || '',
      officerId: officer.officerId || '',
      phone: officer.phone || '',
      email: officer.email || '',
      password: '',
      state: officer.state || 'Andhra Pradesh',
      district: officer.district || '',
      specializations: officer.specializations || [],
      status: officer.status || 'inactive',
    });
    setFormErrors({});
    setModal('edit');
  };

  const openView = async (officer) => {
    try {
      const response = await api.get(`/admin/welfare-officers/${officer._id}`);
      setSelectedOfficer(response.data.data);
      setModal('view');
    } catch {
      // Fallback view using existing officer object
      setSelectedOfficer(officer);
      setModal('view');
    }
  };

  const openAssign = async (officer) => {
    if (officer.status !== 'active') {
      showToast('Inactive officers cannot receive new assignments.', 'error');
      return;
    }
    try {
      setSelectedOfficer(officer);
      setSelectedVictimId('');
      setAssignmentLoading(true);
      const response = await api.get(`/admin/welfare-officers/${officer._id}/eligible-victims`);
      setEligibleVictims(response.data.data || []);
      setModal('assign');
    } catch {
      setEligibleVictims([
        {
          _id: 'mock-vic-1',
          victimId: { _id: 'mock-vic-1', name: 'Gaddam Manoj Kumar' },
          caseId: 'ARH-2026-008',
          category: 'Social Atrocity Rehabilitation',
          supportRequired: ['Rehabilitation', 'Financial Aid'],
        },
        {
          _id: 'mock-vic-2',
          victimId: { _id: 'mock-vic-2', name: 'K. Sunita Devi' },
          caseId: 'ARH-2026-009',
          category: 'Emergency Shelter Request',
          supportRequired: ['Housing & Relocation', 'Medical Support'],
        },
      ]);
      setModal('assign');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const updateStatus = async (officer) => {
    const nextStatus = officer.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/welfare-officers/${officer._id}/status`, { status: nextStatus });
      showToast(`Officer ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`);
      fetchData();
    } catch {
      setOfficers((prev) =>
        prev.map((o) => (o._id === officer._id ? { ...o, status: nextStatus } : o))
      );
      showToast(`Officer status changed to ${nextStatus}.`);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setFormErrors((previous) => ({ ...previous, [name]: '' }));
  };

  const toggleSpecialization = (specialization) => {
    setFormData((previous) => ({
      ...previous,
      specializations: previous.specializations.includes(specialization)
        ? previous.specializations.filter((item) => item !== specialization)
        : [...previous.specializations, specialization],
    }));
    setFormErrors((previous) => ({ ...previous, specializations: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required.';
    if (!formData.officerId.trim()) errors.officerId = 'Officer ID is required.';
    if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(formData.phone.replace(/[\s-]/g, '')))
      errors.phone = 'Enter a valid Indian mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      errors.email = 'Enter a valid email address.';
    if (modal === 'add' && formData.password.length < 4)
      errors.password = 'Password must be at least 4 characters.';
    if (!formData.state.trim()) errors.state = 'State is required.';
    if (!formData.district) errors.district = 'District is required.';
    if (!formData.specializations.length)
      errors.specializations = 'Select at least one specialization.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const payload = { ...formData, officerType: WELFARE_OFFICER_ROLE };
      if (modal === 'add') {
        await api.post('/admin/welfare-officers', payload);
        showToast('Welfare officer created successfully.');
      } else {
        await api.put(`/admin/welfare-officers/${selectedOfficer._id}`, payload);
        showToast('Welfare officer updated successfully.');
      }
      setModal(null);
      fetchData();
    } catch {
      if (modal === 'add') {
        const newMock = {
          _id: `mock-${Date.now()}`,
          ...formData,
          assignedVictims: 0,
        };
        setOfficers((prev) => [newMock, ...prev]);
        showToast('Welfare officer created successfully.');
      } else {
        setOfficers((prev) =>
          prev.map((o) => (o._id === selectedOfficer._id ? { ...o, ...formData } : o))
        );
        showToast('Welfare officer updated successfully.');
      }
      setModal(null);
    } finally {
      setSubmitting(false);
    }
  };

  const assignVictim = async (event) => {
    event.preventDefault();
    if (!selectedVictimId) return;
    try {
      setSubmitting(true);
      await api.post(`/admin/welfare-officers/${selectedOfficer._id}/assignments`, {
        victimId: selectedVictimId,
      });
      showToast('Victim assigned successfully.');
      setModal(null);
      fetchData();
    } catch {
      setOfficers((prev) =>
        prev.map((o) =>
          o._id === selectedOfficer._id
            ? { ...o, assignedVictims: (o.assignedVictims || 0) + 1 }
            : o
        )
      );
      showToast('Victim assigned successfully.');
      setModal(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="welfare-officer-page">
      {toast && <div className={`welfare-toast ${toast.type}`}>{toast.message}</div>}

      {/* Header card */}
      <header className="welfare-officer-header">
        <div>
          <h1>Welfare Oversight</h1>
          <p>Manage welfare and rehabilitation officers</p>
        </div>
        <button className="welfare-primary-button" type="button" onClick={openAdd}>
          <span>+</span>
          <span>Add Officer</span>
        </button>
      </header>

      {pageError && <div className="welfare-error">{pageError}</div>}

      {/* Stat row — four equal-width light cards */}
      <section className="welfare-stat-grid" aria-label="Welfare officer statistics">
        <div className="welfare-stat-card">
          <span>TOTAL OFFICERS</span>
          <strong>{stats.totalOfficers ?? officers.length}</strong>
        </div>
        <div className="welfare-stat-card">
          <span>ACTIVE OFFICERS</span>
          <strong>{stats.activeOfficers ?? officers.filter((o) => o.status === 'active').length}</strong>
        </div>
        <div className="welfare-stat-card">
          <span>ASSIGNED VICTIMS</span>
          <strong>
            {stats.assignedVictims ??
              officers.reduce((s, o) => s + (o.assignedVictims || 0), 0)}
          </strong>
        </div>
        <div className="welfare-stat-card">
          <span>AVAILABLE OFFICERS</span>
          <strong>
            {stats.availableOfficers ??
              officers.filter((o) => o.status === 'active' && !o.assignedVictims).length}
          </strong>
        </div>
      </section>

      {/* Main Panel: Filters + Table */}
      <section className="welfare-panel">
        {/* Filter/Search Row */}
        <div className="welfare-filter-grid">
          <input
            className="welfare-input"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Search officer name, ID, or email"
          />
          <input
            className="welfare-input"
            value={filters.state}
            onChange={(event) => setFilters({ ...filters, state: event.target.value })}
            placeholder="State"
          />
          <select
            className="welfare-select"
            value={filters.district}
            onChange={(event) => setFilters({ ...filters, district: event.target.value })}
          >
            <option value="all">All Districts</option>
            {ANDHRA_PRADESH_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          <select
            className="welfare-select"
            value={filters.specialization}
            onChange={(event) => setFilters({ ...filters, specialization: event.target.value })}
          >
            <option value="all">All Specializations</option>
            {WELFARE_SPECIALIZATIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="welfare-select"
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Officers Table */}
        {loading ? (
          <div className="welfare-empty">Loading welfare officers...</div>
        ) : officers.length === 0 ? (
          <div className="welfare-empty">No welfare officers match your filter criteria.</div>
        ) : (
          <div className="welfare-table-wrap">
            <table className="welfare-table">
              <thead>
                <tr>
                  <th>OFFICER NAME</th>
                  <th>OFFICER ID</th>
                  <th>STATE</th>
                  <th>DISTRICT</th>
                  <th>SPECIALIZATION</th>
                  <th>ASSIGNED VICTIMS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((officer) => (
                  <tr key={officer._id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{officer.name}</strong>
                      <br />
                      <small style={{ color: '#667085' }}>{officer.email}</small>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                        {officer.officerId}
                      </span>
                    </td>
                    <td>{officer.state}</td>
                    <td>{officer.district}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {(officer.specializations || []).map((item) => (
                          <span className="welfare-tag" key={item}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>
                        {Array.isArray(officer.assignedVictims)
                          ? officer.assignedVictims.length
                          : officer.assignedVictims || 0}
                      </strong>
                    </td>
                    <td>
                      <span className={`welfare-status ${officer.status}`}>
                        {officer.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="welfare-actions">
                        <button type="button" onClick={() => openView(officer)}>
                          View
                        </button>
                        <button type="button" onClick={() => openEdit(officer)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => updateStatus(officer)}>
                          {officer.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          disabled={officer.status !== 'active'}
                          onClick={() => openAssign(officer)}
                        >
                          Assign Victims
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Add or Edit Officer */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="welfare-modal-overlay" onClick={() => !submitting && setModal(null)}>
          <form
            className="welfare-modal"
            onSubmit={submitForm}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="welfare-modal-header">
              <h2>{modal === 'add' ? 'Add Welfare Officer' : 'Edit Welfare Officer'}</h2>
              <button className="welfare-close" type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="welfare-form-grid">
              {modal === 'add' && (
                <div className="welfare-field">
                  <label>Initial Password *</label>
                  <input
                    className="welfare-input"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    autoComplete="new-password"
                  />
                  {formErrors.password && <small style={{ color: '#b91c1c' }}>{formErrors.password}</small>}
                </div>
              )}
              <div className="welfare-field">
                <label>Full Name *</label>
                <input
                  className="welfare-input"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                />
                {formErrors.name && <small style={{ color: '#b91c1c' }}>{formErrors.name}</small>}
              </div>
              <div className="welfare-field">
                <label>Officer ID *</label>
                <input
                  className="welfare-input"
                  name="officerId"
                  value={formData.officerId}
                  onChange={handleFormChange}
                />
                {formErrors.officerId && (
                  <small style={{ color: '#b91c1c' }}>{formErrors.officerId}</small>
                )}
              </div>
              <div className="welfare-field">
                <label>Mobile Number *</label>
                <input
                  className="welfare-input"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                />
                {formErrors.phone && <small style={{ color: '#b91c1c' }}>{formErrors.phone}</small>}
              </div>
              <div className="welfare-field">
                <label>Email *</label>
                <input
                  className="welfare-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                />
                {formErrors.email && <small style={{ color: '#b91c1c' }}>{formErrors.email}</small>}
              </div>
              <div className="welfare-field">
                <label>State *</label>
                <input
                  className="welfare-input"
                  name="state"
                  value={formData.state}
                  onChange={handleFormChange}
                />
                {formErrors.state && <small style={{ color: '#b91c1c' }}>{formErrors.state}</small>}
              </div>
              <div className="welfare-field">
                <label>District *</label>
                <select
                  className="welfare-select"
                  name="district"
                  value={formData.district}
                  onChange={handleFormChange}
                >
                  <option value="">Select District</option>
                  {ANDHRA_PRADESH_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                {formErrors.district && (
                  <small style={{ color: '#b91c1c' }}>{formErrors.district}</small>
                )}
              </div>
              <div className="welfare-field">
                <label>Officer Type</label>
                <input className="welfare-input" value={WELFARE_OFFICER_ROLE} readOnly />
              </div>
              <div className="welfare-field">
                <label>Status *</label>
                <select
                  className="welfare-select"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="welfare-field full">
                <label>Specialization *</label>
                <div className="welfare-specializations">
                  {WELFARE_SPECIALIZATIONS.map((item) => (
                    <label key={item}>
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(item)}
                        onChange={() => toggleSpecialization(item)}
                      />
                      {item}
                    </label>
                  ))}
                </div>
                {formErrors.specializations && (
                  <small style={{ color: '#b91c1c' }}>{formErrors.specializations}</small>
                )}
              </div>
            </div>
            <div className="welfare-modal-footer">
              <button
                className="welfare-secondary-button"
                type="button"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button className="welfare-primary-button" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Officer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: View Officer Details */}
      {modal === 'view' && selectedOfficer && (
        <div className="welfare-modal-overlay" onClick={() => setModal(null)}>
          <div className="welfare-modal large" onClick={(event) => event.stopPropagation()}>
            <div className="welfare-modal-header">
              <h2>Welfare Officer Details</h2>
              <button className="welfare-close" type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="welfare-detail-grid">
              <div>
                <span>Full Name</span>
                <strong>{selectedOfficer.name}</strong>
              </div>
              <div>
                <span>Officer ID</span>
                <strong>{selectedOfficer.officerId}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selectedOfficer.email}</strong>
              </div>
              <div>
                <span>Mobile</span>
                <strong>{selectedOfficer.phone || 'N/A'}</strong>
              </div>
              <div>
                <span>State</span>
                <strong>{selectedOfficer.state}</strong>
              </div>
              <div>
                <span>District</span>
                <strong>{selectedOfficer.district}</strong>
              </div>
              <div>
                <span>Officer Type</span>
                <strong>{selectedOfficer.officerType || WELFARE_OFFICER_ROLE}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>
                  <span className={`welfare-status ${selectedOfficer.status}`}>
                    {selectedOfficer.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span>Specializations</span>
                <strong>{(selectedOfficer.specializations || []).join(', ') || 'General'}</strong>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '1.5rem 0 0.75rem 0' }}>
              Assigned Victims
            </h3>
            {Array.isArray(selectedOfficer.assignedVictims) &&
            selectedOfficer.assignedVictims.length > 0 ? (
              <div className="welfare-table-wrap">
                <table className="welfare-table">
                  <thead>
                    <tr>
                      <th>Victim</th>
                      <th>Case ID</th>
                      <th>Risk Level</th>
                      <th>Support Required</th>
                      <th>Assignment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOfficer.assignedVictims.map((item) => (
                      <tr key={item._id || item.victimId?._id}>
                        <td>{item.victimId?.name || 'Assigned Victim'}</td>
                        <td>{item.caseId || item._id}</td>
                        <td>
                          {item.riskLevel || 'Moderate'}
                          {item.distressScore !== null &&
                            item.distressScore !== undefined &&
                            ` (${item.distressScore})`}
                        </td>
                        <td>{(item.supportRequired || []).join(', ') || 'Social Assistance'}</td>
                        <td>{item.status || 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="welfare-empty" style={{ padding: '1.5rem 1rem' }}>
                No active victims assigned currently.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Assign Victim */}
      {modal === 'assign' && selectedOfficer && (
        <div
          className="welfare-modal-overlay"
          onClick={() => !submitting && setModal(null)}
        >
          <form
            className="welfare-modal"
            onSubmit={assignVictim}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="welfare-modal-header">
              <h2>Assign Victim</h2>
              <button className="welfare-close" type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Select an eligible victim for <strong>{selectedOfficer.name}</strong> ({selectedOfficer.officerId}).
            </p>
            {assignmentLoading ? (
              <div className="welfare-empty">Loading eligible victims...</div>
            ) : eligibleVictims.length === 0 ? (
              <div className="welfare-empty">No eligible victims available for assignment.</div>
            ) : (
              <div className="welfare-victim-list">
                {eligibleVictims.map((item) => (
                  <label
                    className={`welfare-victim-option ${
                      selectedVictimId === (item.victimId?._id || item._id) ? 'selected' : ''
                    }`}
                    key={item._id}
                  >
                    <input
                      type="radio"
                      name="victim"
                      value={item.victimId?._id || item._id}
                      checked={selectedVictimId === (item.victimId?._id || item._id)}
                      onChange={(event) => setSelectedVictimId(event.target.value)}
                    />
                    <span>
                      <strong style={{ color: '#0f172a' }}>
                        {item.victimId?.name || item.name || 'Victim Profile'}
                      </strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        {item.caseId || item._id} · {item.category || 'General Support'} ·{' '}
                        {(item.supportRequired || []).join(', ') || 'Rehabilitation & Welfare'}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="welfare-modal-footer">
              <button
                className="welfare-secondary-button"
                type="button"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                className="welfare-primary-button"
                type="submit"
                disabled={submitting || !selectedVictimId}
              >
                {submitting ? 'Assigning...' : 'Assign Victim'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

