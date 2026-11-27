import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Store,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Lock,
  Save,
  Edit3,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  LogOut,
  ChevronRight,
  Printer,
  Receipt,
  Users,
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog } from '../utils/alerts';

const ICON_MAP = {
  Banknote,
  QrCode,
  CreditCard,
  Tag,
  Wallet: CreditCard,
};

export default function StoreProfile() {
  const navigate = useNavigate();

  // Active Tab: 'PROFILE' | 'PAYMENT' | 'SUBSCRIPTION'
  const [activeTab, setActiveTab] = useState('PROFILE');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Profile data
  const [profileData, setProfileData] = useState({
    user: null,
    tenant: null,
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    businessName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    password: '',
  });

  // Payment tab state
  const [paymentModes, setPaymentModes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [newModeName, setNewModeName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Fetch full profile and store details
  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, payRes, billRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/admin/payment-modes').catch(() => ({ data: {} })),
        api.get('/admin/bill-settings').catch(() => ({ data: {} })),
      ]);

      if (profRes.data?.success) {
        const { user, tenant } = profRes.data.data;
        setProfileData({ user, tenant });
        setProfileForm({
          name: user?.name || '',
          phone: user?.phone || tenant?.phone || '',
          businessName: tenant?.businessName || '',
          address: tenant?.address || '',
          city: tenant?.city || '',
          state: tenant?.state || '',
          pincode: tenant?.pincode || '',
          gstin: tenant?.gstin || '',
          password: '',
        });
      }

      if (payRes.data?.success) {
        setPaymentModes(payRes.data.data || []);
        setSuggestions(payRes.data.suggestions || []);
      }

      if (billRes.data?.success && billRes.data.data) {
        setUpiId(billRes.data.data.upiId || '');
      }
    } catch (err) {
      console.error('Failed to load profile & settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Profile (Personal & Store Creation Info)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!profileForm.name.trim()) {
      setErrorMsg('Admin Name is required');
      return;
    }
    if (!profileForm.businessName.trim()) {
      setErrorMsg('Business / Store Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        businessName: profileForm.businessName.trim(),
        address: profileForm.address.trim(),
        city: profileForm.city.trim(),
        state: profileForm.state.trim(),
        pincode: profileForm.pincode.trim(),
        gstin: profileForm.gstin.trim(),
      };

      if (profileForm.password.trim()) {
        payload.password = profileForm.password.trim();
      }

      const res = await api.put('/auth/profile', payload);
      if (res.data?.success) {
        const { user, tenant } = res.data.data;
        setProfileData({ user, tenant });

        // Update localStorage
        const localUser = JSON.parse(localStorage.getItem('client_admin_user') || '{}');
        const updatedLocal = {
          ...localUser,
          name: user.name,
          phone: user.phone,
          tenant: {
            ...localUser.tenant,
            ...tenant,
          },
        };
        localStorage.setItem('client_admin_user', JSON.stringify(updatedLocal));

        setSuccessMsg('Profile & Store details updated successfully!');
        setIsEditingProfile(false);
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        throw new Error(res.data?.error || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  // Payment tab handlers
  const handleAddSuggestion = async (sugg) => {
    try {
      const res = await api.post('/admin/payment-modes', {
        name: sugg.name,
        code: sugg.code,
        icon: sugg.icon,
        color: sugg.color,
        description: sugg.description,
      });
      if (res.data?.success) {
        setPaymentModes((prev) => [...prev, res.data.data]);
        setSuggestions((prev) => prev.filter((s) => s.code !== sugg.code));
        setSuccessMsg(`Payment mode "${sugg.name}" added!`);
        setTimeout(() => setSuccessMsg(''), 2500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to add payment mode');
    }
  };

  const handleAddCustomMode = async (e) => {
    e.preventDefault();
    if (!newModeName.trim()) return;

    try {
      const res = await api.post('/admin/payment-modes', {
        name: newModeName.trim(),
      });
      if (res.data?.success) {
        setPaymentModes((prev) => [...prev, res.data.data]);
        setNewModeName('');
        setSuccessMsg(`Custom mode "${newModeName.trim()}" created!`);
        setTimeout(() => setSuccessMsg(''), 2500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to add custom payment mode');
    }
  };

  const handleToggleMode = async (id) => {
    try {
      const res = await api.put(`/admin/payment-modes/${id}/toggle`);
      if (res.data?.success) {
        setPaymentModes((prev) =>
          prev.map((m) => (m.id === id || m._id === id ? res.data.data : m))
        );
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to toggle mode');
    }
  };

  const handleDeleteMode = async (id, name) => {
    const confirmed = await confirmDialog({
      title: `Delete "${name}"?`,
      text: 'This payment mode will be permanently removed from POS checkout.',
      isDangerous: true,
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/admin/payment-modes/${id}`);
      if (res.data?.success) {
        setPaymentModes((prev) => prev.filter((m) => m.id !== id && m._id !== id));
        if (res.data.suggestion) {
          setSuggestions((prev) => [...prev, res.data.suggestion]);
        }
        setSuccessMsg(`Mode "${name}" removed`);
        setTimeout(() => setSuccessMsg(''), 2500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete payment mode');
    }
  };

  const handleSaveUpiId = async () => {
    setSavingPayment(true);
    try {
      const res = await api.put('/admin/bill-settings', { upiId: upiId.trim() });
      if (res.data?.success) {
        setSuccessMsg('Store UPI ID for customer QR saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save UPI ID');
    } finally {
      setSavingPayment(false);
    }
  };

  // Safe Logout
  const handleLogout = async () => {
    const confirmed = await confirmDialog({
      title: 'Log Out of Store?',
      text: 'You will need your login credentials to sign in again.',
    });
    if (!confirmed) return;

    localStorage.removeItem('client_admin_token');
    localStorage.removeItem('client_admin_user');
    navigate('/login');
  };

  const user = profileData.user;
  const tenant = profileData.tenant;
  const sub = tenant?.currentSubscription;

  return (
    <AppLayout
      title="Store Profile & Settings"
      subtitle="Account, Payments & License"
      actionButton={
        activeTab === 'PROFILE' && !isEditingProfile ? (
          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        ) : null
      }
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Navigation Tabs (Profile | Payment | Subscription) */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-xs grid grid-cols-3 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PROFILE');
              setErrorMsg('');
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'PROFILE'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('PAYMENT');
              setIsEditingProfile(false);
              setErrorMsg('');
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'PAYMENT'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('SUBSCRIPTION');
              setIsEditingProfile(false);
              setErrorMsg('');
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'SUBSCRIPTION'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Subscription</span>
          </button>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading store details...</div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* TAB 1: PROFILE (VIEW / EDIT COMPLETE ONBOARDING DATA)                     */}
            {/* ========================================================================= */}
            {activeTab === 'PROFILE' && (
              <div className="space-y-4">
                {isEditingProfile ? (
                  /* EDIT MODE */
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    {/* Admin Personal Details */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Admin Personal Details
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Owner / Admin Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            placeholder="e.g. Ramesh Sharma"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Phone / Mobile Number
                          </label>
                          <input
                            type="tel"
                            maxLength={10}
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                phone: e.target.value.replace(/\D/g, ''),
                              })
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            placeholder="10-digit mobile"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Login Email (Registered Identity)
                          </label>
                          <input
                            type="email"
                            disabled
                            value={user?.email || ''}
                            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed select-all"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Login email cannot be changed directly for store account security.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Store & Business Information */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Store & Business Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Business / Store Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={profileForm.businessName}
                            onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            placeholder="e.g. Apex Mart Superstore"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            GSTIN (Tax Identification)
                          </label>
                          <input
                            type="text"
                            maxLength={15}
                            value={profileForm.gstin}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, gstin: e.target.value.toUpperCase() })
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            placeholder="e.g. 09AAACH7409R1ZZ"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            placeholder="e.g. Mumbai"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={profileForm.state}
                            onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            placeholder="e.g. Maharashtra"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Pincode
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={profileForm.pincode}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                pincode: e.target.value.replace(/\D/g, ''),
                              })
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            placeholder="e.g. 400001"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Store Address
                          </label>
                          <input
                            type="text"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            placeholder="Shop No., Market, Road"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Change Password (Optional) */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Security: Update Password
                          </h3>
                          <p className="text-[10px] text-slate-400">Leave blank if you don't wish to change password</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          New Password (Optional)
                        </label>
                        <input
                          type="password"
                          value={profileForm.password}
                          onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                          placeholder="Min 6 characters to update password"
                        />
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* VIEW MODE */
                  <div className="space-y-4">
                    {/* Admin Profile Overview Card */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm relative space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/25 shrink-0">
                            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-base font-black text-slate-900 truncate">
                                {user?.name || 'Store Admin'}
                              </h2>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Store Admin'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5 font-bold">
                              {tenant?.businessName || 'Apex Mart Superstore'}
                            </p>
                            <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                              @{tenant?.slug || 'apex-mart'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(true)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0 active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* Onboarding Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 text-xs">
                        <div className="p-3 bg-slate-50 rounded-2xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Login Email
                          </span>
                          <span className="font-bold text-slate-800 truncate block mt-0.5">
                            {user?.email || 'N/A'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Contact Phone
                          </span>
                          <span className="font-bold text-slate-800 font-mono block mt-0.5">
                            {user?.phone || tenant?.phone || 'Not provided'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            GSTIN
                          </span>
                          <span className="font-bold text-slate-800 font-mono block mt-0.5">
                            {tenant?.gstin || 'Not registered'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Location
                          </span>
                          <span className="font-bold text-slate-800 block mt-0.5 truncate">
                            {tenant?.city || 'City'}, {tenant?.state || 'State'} {tenant?.pincode ? `(${tenant.pincode})` : ''}
                          </span>
                        </div>

                        {tenant?.address && (
                          <div className="p-3 bg-slate-50 rounded-2xl sm:col-span-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Store Address
                            </span>
                            <span className="font-bold text-slate-800 block mt-0.5">
                              {tenant.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Store Links */}
                    <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1 pb-1">
                        Store Management Shortcuts
                      </h3>

                      <Link
                        to="/employees"
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Store Employees (Cashiers)</p>
                            <p className="text-[10px] text-slate-500">Manage cashier accounts & counter staff</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      <Link
                        to="/bill-settings"
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Printer className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Receipt Header & Footer</p>
                            <p className="text-[10px] text-slate-500">Customize thermal invoice branding & terms</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      <Link
                        to="/invoices"
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Past Bills & Invoices</p>
                            <p className="text-[10px] text-slate-500">Sales records & PDF receipt downloads</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    </div>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out of Store</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: PAYMENT (STORE PAYMENT MODES & CUSTOMER UPI / QR)                 */}
            {/* ========================================================================= */}
            {activeTab === 'PAYMENT' && (
              <div className="space-y-4">
                {/* 1. Store UPI ID Configuration */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Store UPI ID for Customer QR
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Prints dynamic payment QR on bills so customers can scan & pay instantly
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. apexmart@upi / 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveUpiId}
                      disabled={savingPayment}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm active:scale-95"
                    >
                      {savingPayment ? 'Saving...' : 'Save UPI'}
                    </button>
                  </div>
                </div>

                {/* 2. 1-Click Platform Suggestions */}
                {suggestions.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Quick Add Suggestions (1-Click)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Click any popular payment mode below to instantly enable it for your store:
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((sugg) => (
                        <button
                          key={sugg.code}
                          type="button"
                          onClick={() => handleAddSuggestion(sugg)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 hover:text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{sugg.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Add Custom Mode Form */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Add Custom Store Payment Mode
                  </h4>
                  <form onSubmit={handleAddCustomMode} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Bajaj Finserv / Store Khata / Sodexo..."
                      value={newModeName}
                      onChange={(e) => setNewModeName(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!newModeName.trim()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm active:scale-95 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Mode</span>
                    </button>
                  </form>
                </div>

                {/* 4. Active Payment Modes List */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Configured Payment Modes ({paymentModes.length})
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Used at POS Checkout</span>
                  </div>

                  {paymentModes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No payment modes configured. Click suggestions above to add standard modes.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paymentModes.map((mode) => {
                        const Icon = ICON_MAP[mode.icon] || CreditCard;
                        return (
                          <div
                            key={mode.id || mode._id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                              mode.isActive
                                ? 'bg-white border-slate-200 shadow-2xs'
                                : 'bg-slate-50 border-slate-200/50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  mode.isActive
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-black text-slate-900 truncate">
                                    {mode.name}
                                  </p>
                                  {mode.isDefault && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Code: {mode.code}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleMode(mode.id || mode._id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  mode.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {mode.isActive ? 'Active' : 'Disabled'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMode(mode.id || mode._id, mode.name)}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all"
                                title="Delete payment mode"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: SUBSCRIPTION & LICENSE                                            */}
            {/* ========================================================================= */}
            {activeTab === 'SUBSCRIPTION' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Active License Details</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {sub?.status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Plan Name:</span>
                      <span className="font-black text-slate-900">
                        {sub?.plan?.name || sub?.planName || 'Retail Growth Plan'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Billing Cycle:</span>
                      <span className="font-semibold text-slate-800">
                        {sub?.plan?.durationType || 'MONTHLY'}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>POS Billing, Invoices & All Features Active</span>
                    </div>

                    <Link
                      to="/subscription"
                      className="mt-3 w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>View All Plans & Booster Top-ups</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
