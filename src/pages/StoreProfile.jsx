import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  User,
  Building2,
  Lock,
  Save,
  Edit3,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogOut,
  ChevronRight,
  Printer,
  Receipt,
  Users,
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog } from '../utils/alerts';

export default function StoreProfile() {
  const navigate = useNavigate();

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

  // Fetch full profile and store details
  const loadData = async () => {
    setLoading(true);
    try {
      const profRes = await api.get('/auth/profile');

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

  return (
    <AppLayout
      title="Store Profile & Settings"
      subtitle="Account & Store Details"
      actionButton={
        !isEditingProfile ? (
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
          <div className="space-y-4">
            {isEditingProfile ? (
              /* ==================== EDIT MODE ==================== */
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
              /* ==================== VIEW MODE ==================== */
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

                {/* Quick Store Links / STORE MANAGEMENT SHORTCUTS */}
                <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1 pb-1">
                    Store Management Shortcuts
                  </h3>

                  {/* 1. Store Employees */}
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

                  {/* 2. Payment Modes & QR (NEW DEDICATED SECTION) */}
                  <Link
                    to="/payment-modes"
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Payment Modes & QR</p>
                        <p className="text-[10px] text-slate-500">Manage UPI, Card, Cash & custom payment modes</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  {/* 3. Receipt Header & Footer */}
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

                  {/* 4. Past Bills & Invoices */}
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

                  {/* 5. Subscription & License */}
                  <Link
                    to="/subscription"
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Store Subscription & License</p>
                        <p className="text-[10px] text-slate-500">View active plan, quotas & renewals</p>
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
      </div>
    </AppLayout>
  );
}
