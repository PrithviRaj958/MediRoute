import React, { useState } from 'react';
import { createHospital } from '../../services/adminService';

export default function CreateHospitalModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', address: '', contactNumber: '', totalBeds: '', lat: '', lng: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.lat || !form.lng) return setError('Coordinates are required');
    setLoading(true);
    try {
      await createHospital({
        name: form.name,
        address: form.address,
        contactNumber: form.contactNumber,
        totalBeds: Number(form.totalBeds),
        location: [parseFloat(form.lng), parseFloat(form.lat)]
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
      <div className="modal-box modal-box-wide">
        <div className="modal-header">
          <h3>🏥 Create New Hospital</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Hospital Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. City General Hospital" required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Full address" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Number</label>
              <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="+91 98765 43210" required />
            </div>
            <div className="form-group">
              <label>Total Beds</label>
              <input name="totalBeds" type="number" min="1" value={form.totalBeds} onChange={handleChange} placeholder="100" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input name="lat" type="number" step="any" value={form.lat} onChange={handleChange} placeholder="12.9716" required />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input name="lng" type="number" step="any" value={form.lng} onChange={handleChange} placeholder="77.5946" required />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : '+ Create Hospital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
