import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { Users, Save, AlertCircle, KeyRound } from 'lucide-react';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/alerts';

const DESIGNATIONS = [
  'Cashier',
  'Billing Staff',
  'Store Manager',
  'Sales Executive',
  'Accountant',
  'Inventory Helper',
];

export default function EmployeeForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Cashier',
    password: '',
    newPassword: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (!isEditing) return;
    setLoading(true);
    api
      .get(`/admin/employees/${id}`)
      .then((res) => {
        const emp = res.data?.data;
        if (emp) {
          setFormData({
            name: emp.name || '',
            email: emp.email || '',
            phone: emp.phone || '',
            designation: emp.designation || 'Cashier',
            password: '',
            newPassword: '',
            status: emp.status || 'ACTIVE',
          });
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load employee details');
      })
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#';
    let pwd = '';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (isEditing) {
      setFormData((prev) => ({ ...prev, newPassword: pwd }));
    } else {
      setFormData((prev) => ({ ...prev, password: pwd }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEditing) {
        const payload = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          designation: formData.designation,
          status: formData.status,
        };
        if (formData.newPassword.trim()) {
          payload.newPassword = formData.newPassword.trim();
        }
        await api.put(`/admin/employees/${id}`, payload);
        toastSuccess('Employee updated successfully!');
      } else {
        await api.post('/admin/employees', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          designation: formData.designation,
          password: formData.password,
          status: formData.status,
        });
        toastSuccess('New employee added successfully!');
      }

      navigate('/employees');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save employee';
      setError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout
      title={isEditing ? 'Edit Employee' : 'Add New Employee'}
      subtitle="Store Staff Management"
      backTo="/employees"
      hideBottomNav={true}
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading employee details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employee Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Verma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Role / Designation *
                </label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  {DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Login Email *
              </label>
              <input
                type="email"
                required
                disabled={isEditing}
                placeholder="rahul@store.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white disabled:opacity-60"
              />
            </div>

            {!isEditing ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Login Password *</label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800"
                  >
                    Generate Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    Reset Password (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900"
                  >
                    Generate New
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Leave blank to keep current password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Link
                to="/employees"
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-center hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : isEditing ? 'Update Employee' : 'Add Employee'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
