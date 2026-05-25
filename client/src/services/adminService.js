const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ── Stats ──────────────────────────────────────────
export const getStats = () =>
  fetch(`${API_BASE}/api/admin/stats`, { headers: getHeaders() }).then(handleResponse);

// ── Hospitals ──────────────────────────────────────
export const getHospitals = () =>
  fetch(`${API_BASE}/api/admin/hospitals`, { headers: getHeaders() }).then(handleResponse);

export const createHospital = (data) =>
  fetch(`${API_BASE}/api/admin/hospitals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse);

export const assignHospitalAdmin = (hospitalId, userId) =>
  fetch(`${API_BASE}/api/admin/hospitals/${hospitalId}/assign-admin`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ userId })
  }).then(handleResponse);

export const deleteHospital = (id) =>
  fetch(`${API_BASE}/api/admin/hospitals/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  }).then(handleResponse);

// ── Ambulances ─────────────────────────────────────
export const getAmbulances = () =>
  fetch(`${API_BASE}/api/admin/ambulances`, { headers: getHeaders() }).then(handleResponse);

export const createAmbulance = (data) =>
  fetch(`${API_BASE}/api/admin/ambulances`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse);

export const assignDriver = (ambulanceId, userId) =>
  fetch(`${API_BASE}/api/admin/ambulances/${ambulanceId}/assign-driver`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ userId })
  }).then(handleResponse);

export const deleteAmbulance = (id) =>
  fetch(`${API_BASE}/api/admin/ambulances/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  }).then(handleResponse);

// ── Users ──────────────────────────────────────────
export const getUsers = (role = '') =>
  fetch(`${API_BASE}/api/admin/users${role ? `?role=${role}` : ''}`, {
    headers: getHeaders()
  }).then(handleResponse);

export const deleteUser = (id) =>
  fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  }).then(handleResponse);

// ── Emergencies ────────────────────────────────────
export const getEmergencies = (status = '') =>
  fetch(`${API_BASE}/api/admin/emergencies${status ? `?status=${status}` : ''}`, {
    headers: getHeaders()
  }).then(handleResponse);
