import React, { useState } from 'react';
import { createAmbulance } from '../../services/adminService';

export default function CreateAmbulanceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    vehicleNumber: '',
    capability: 'BLS',
    status: 'AVAILABLE',
    lat: '',
    lng: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createAmbulance({
        vehicleNumber: form.vehicleNumber,
        capability: form.capability,
        status: form.status,
        coordinates: form.lat && form.lng
          ? [parseFloat(form.lng), parseFloat(form.lat)]
          : [0, 0]
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>🚑 Create New Ambulance</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vehicle Number</label>
            <input
              name="vehicleNumber"
              value={form.vehicleNumber}
              onChange={handleChange}
              placeholder="KA-01-AB-1234"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Capability</label>
              <select name="capability" value={form.capability} onChange={handleChange}>
                <option value="BLS">BLS — Basic Life Support</option>
                <option value="ALS">ALS — Advanced Life Support</option>
              </select>
            </div>
            <div className="form-group">
              <label>Initial Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="AVAILABLE">Available</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude (optional)</label>
              <input
                name="lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={handleChange}
                placeholder="12.9716"
              />
            </div>
            <div className="form-group">
              <label>Longitude (optional)</label>
              <input
                name="lng"
                type="number"
                step="any"
                value={form.lng}
                onChange={handleChange}
                placeholder="77.5946"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : '+ Create Ambulance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
