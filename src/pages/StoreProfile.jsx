import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Store,
  User,
  Users,
  Layers,
  Calendar,
  LogOut,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Receipt,
  Printer,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog, toastSuccess } from '../utils/alerts';

export default function StoreProfile() {
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then((res) => {
      if (res.data?.success) setStoreData(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    const confirmed = await confirmDialog({
      title: 'Log Out of Store?',
      text: 'You will need your client credentials to log in again.',
      confirmButtonText: 'Yes, Log Out',
      isDangerous: true,
    });
    if (!confirmed) return;

    localStorage.removeItem('client_admin_token');
    localStorage.removeItem('client_admin_user');
    toastSuccess('Logged out successfully');
    navigate('/login');
  };

  const store = storeData?.store;
  const sub = storeData?.subscription;
  const user = JSON.parse(localStorage.getItem('client_admin_user') || '{}');

  return (
    <AppLayout title="Store & Account" subtitle="Profile & Subscription">
      <div className="space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-emerald-500/25 mb-3">
            <Store className="w-8 h-8" />
          </div>

          <h2 className="text-base font-black text-slate-900 tracking-tight">
            {store?.name || user?.tenant?.businessName || 'Merchant Store'}
          </h2>
          <p className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 inline-block px-2.5 py-0.5 rounded-full mt-1 border border-emerald-200/60">
            slug: {store?.slug || user?.tenant?.slug || 'shop'}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-left text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Admin Owner</span>
              <span className="font-bold text-slate-800 truncate block">{user?.name || 'Store Admin'}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
              <span className="font-bold text-emerald-700 uppercase block">{store?.status || 'ACTIVE'}</span>
            </div>
          </div>
        </div>

        {/* Subscription License Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Subscription License</span>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {sub?.status || 'Active'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Plan Assigned:</span>
              <span className="font-black text-slate-900">{sub?.planName || 'Pro Plan'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Duration:</span>
              <span className="font-semibold text-slate-800">{sub?.durationType || 'MONTHLY'}</span>
            </div>

            {typeof sub?.daysRemaining === 'number' && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Validity Remaining:</span>
                <span className="font-bold text-emerald-600">
                  {sub.daysRemaining > 0 ? `${sub.daysRemaining} days left` : 'Expired'}
                </span>
              </div>
            )}

            <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold mt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All Permissions & Features Enabled</span>
            </div>

            <Link
              to="/subscription"
              className="mt-3 w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>View All Plans & Upgrade / Renew</span>
            </Link>
          </div>
        </div>

        {/* Billing Configuration & History */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1 pb-1">
            Bill Receipt & Thermal POS
          </h3>

          <Link
            to="/employees"
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Employees & Staff</p>
                <p className="text-[11px] text-slate-500">Add cashiers, managers & staff accounts</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/bill-settings"
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Header & Footer Settings</p>
                <p className="text-[11px] text-slate-500">Shop title, address, GST, terms & preview</p>
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
                <p className="text-xs font-bold text-slate-900">Past Bills & Invoices</p>
                <p className="text-[11px] text-slate-500">View sales history & reprint receipts</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/help"
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Help & Support</p>
                <p className="text-[11px] text-slate-500">Guides, FAQs & live assistance</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
            Contact & Identification
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{user?.email || 'N/A'}</span>
            </div>
            {store?.phone && (
              <div className="flex items-center gap-2.5 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{store.phone}</span>
              </div>
            )}
            {store?.gstin && (
              <div className="flex items-center gap-2.5 text-slate-600 font-mono">
                <span className="font-bold text-slate-800">GSTIN:</span>
                <span>{store.gstin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200/80 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Store</span>
        </button>
      </div>
    </AppLayout>
  );
}
