import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Store,
  User,
  Users,
  Calendar,
  LogOut,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Sparkles,
  Receipt,
  Printer,
  ChevronRight,
  Edit3,
  Save,
  X,
  Lock,
  Building2,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog } from '../utils/alerts';

export default function StoreProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [profileData, setProfileData] = useState({
    user: null,
    tenant: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    storePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    password: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile');
      if (res.data?.success) {
        const { user, tenant } = res.data.data;
        setProfileData({ user, tenant });
        setFormData({
          name: user?.name || '',
          phone: user?.phone || '',
          businessName: tenant?.businessName || '',
          storePhone: tenant?.phone || '',
          address: tenant?.address || '',
          city: tenant?.city || '',
          state: tenant?.state || '',
          pincode: tenant?.pincode || '',
          gstin: tenant?.gstin || '',
          password: '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!formData.businessName.trim()) {
      setErrorMsg('Store / Business Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        businessName: formData.businessName.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        gstin: formData.gstin.trim(),
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await api.put('/auth/profile', payload);
      if (res.data?.success) {
        const { user, tenant } = res.data.data;
        setProfileData({ user, tenant });

        // Update local storage so headers and layouts reflect changes immediately
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

        setSuccessMsg('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error(res.data?.error || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

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
      title="Admin Profile"
      subtitle="Account & Store Settings"
      actionButton={
        !isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setErrorMsg('');
            }}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )
      }
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Status Alerts */}
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
          <div className="py-20 text-center text-xs text-slate-400">Loading profile details...</div>
        ) : isEditing ? (
          /* ========================================================= */
          /* EDIT PROFILE FORM                                         */
          /* ========================================================= */
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Personal Details */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Admin Personal Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="10-digit mobile"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Login Email (Read Only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed select-all"
                  />
                </div>
              </div>
            </div>

            {/* Store & Business Details */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Store & Business Info
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Store / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="e.g. Apex Mart Superstore"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    GSTIN Number (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
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
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="e.g. Mumbai / Delhi"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Store Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="Shop No, Street, Landmark"
                  />
                </div>
              </div>
            </div>

            {/* Security: Change Password (Optional) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Security & Password
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  placeholder="Min 4 characters to change"
                />
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg('');
                }}
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
                <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* ========================================================= */
          /* VIEW PROFILE MODE                                         */
          /* ========================================================= */
          <>
            {/* Header Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/25 shrink-0">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-900 truncate">
                        {user?.name || 'Store Admin'}
                      </h2>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'STAFF' ? 'Staff' : 'Store Admin'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {tenant?.businessName || 'Apex Mart Superstore'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center gap-2 text-slate-700 min-w-0">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user?.email || 'admin@store.com'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center gap-2 text-slate-700 min-w-0">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{user?.phone || tenant?.phone || 'Not provided'}</span>
                </div>
                {tenant?.gstin && (
                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center gap-2 text-slate-700 font-mono sm:col-span-2">
                    <span className="font-bold text-slate-500">GSTIN:</span>
                    <span>{tenant.gstin}</span>
                  </div>
                )}
                {tenant?.address && (
                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center gap-2 text-slate-700 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {tenant.address}{tenant.city ? `, ${tenant.city}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription License Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Active License & Plan</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {sub?.status || 'ACTIVE'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Plan Assigned:</span>
                  <span className="font-black text-slate-900">{sub?.plan?.name || sub?.planName || 'Retail Growth Plan'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-semibold text-slate-800">{sub?.plan?.durationType || 'MONTHLY'}</span>
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold mt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All Store Features & Thermal POS Enabled</span>
                </div>

                <Link
                  to="/subscription"
                  className="mt-3 w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View All Plans & Boosters</span>
                </Link>
              </div>
            </div>

            {/* Quick Navigation Settings */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1 pb-1">
                Store Configurations
              </h3>

              <Link
                to="/bill-settings"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Receipt & Payment Modes</p>
                    <p className="text-[11px] text-slate-500">Header, footer, UPI, QR & custom modes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/employees"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Store Employees (Cashiers)</p>
                    <p className="text-[11px] text-slate-500">Manage cashier logins & counter staff</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/invoices"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Past Bills History</p>
                    <p className="text-[11px] text-slate-500">Sales records & PDF receipt downloads</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Store</span>
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
