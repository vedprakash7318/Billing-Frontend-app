import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { BillSettingsSkeleton } from '../components/Skeletons';
import {
  Save,
  Printer,
  Sparkles,
  Store,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  BookOpen,
  Smartphone,
  Landmark,
  Tag,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import api from '../services/api';
import { toastSuccess, toastError, confirmDialog } from '../utils/alerts';

const ICON_MAP = {
  Banknote,
  QrCode,
  CreditCard,
  BookOpen,
  Smartphone,
  Landmark,
  FileText,
  Tag,
  Wallet,
};

function getModeIcon(iconName) {
  return ICON_MAP[iconName] || CreditCard;
}

export default function BillSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('HEADER'); // 'HEADER' | 'FOOTER' | 'PAYMENT_MODES' | 'PREVIEW'

  const [settings, setSettings] = useState({
    headerTitle: 'TAX INVOICE',
    businessName: '',
    tagline: 'Wholesale & Retail Billing',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    showGstin: true,
    showPhone: true,
    showAddress: true,
    footerMessage: 'Thank You for Shopping With Us! Visit Again 🙏',
    termsAndConditions: '1. Goods once sold cannot be returned without bill.\n2. Warranty as per manufacturer terms.\n3. Subject to local jurisdiction.',
    upiId: '',
    authorizedSignatoryText: 'Authorized Signatory',
    showSignatory: true,
    paperSize: 'THERMAL_80MM',
  });

  // Payment Modes State
  const [paymentModes, setPaymentModes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [newModeName, setNewModeName] = useState('');
  const [addingMode, setAddingMode] = useState(false);

  const fetchSettingsAndModes = async () => {
    try {
      const [setRes, modeRes] = await Promise.all([
        api.get('/admin/bill-settings'),
        api.get('/admin/payment-modes'),
      ]);
      if (setRes.data?.data) {
        setSettings((prev) => ({ ...prev, ...setRes.data.data }));
      }
      if (modeRes.data?.data) {
        setPaymentModes(modeRes.data.data);
        setSuggestions(modeRes.data.suggestions || []);
      }
    } catch (err) {
      console.error('Error fetching settings/modes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndModes();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/bill-settings', settings);
      if (res.data?.success) {
        toastSuccess('Bill Header & Footer settings saved successfully!');
      }
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Add from Suggestion
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
        toastSuccess(`Payment mode "${sugg.name}" added to your store!`);
        // Refresh modes & suggestions
        const refresh = await api.get('/admin/payment-modes');
        if (refresh.data?.data) {
          setPaymentModes(refresh.data.data);
          setSuggestions(refresh.data.suggestions || []);
        }
      }
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to add payment mode');
    }
  };

  // Create Custom Mode
  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!newModeName.trim()) return;
    setAddingMode(true);
    try {
      const res = await api.post('/admin/payment-modes', {
        name: newModeName.trim(),
      });
      if (res.data?.success) {
        toastSuccess(`Payment mode "${newModeName.trim()}" created!`);
        setNewModeName('');
        const refresh = await api.get('/admin/payment-modes');
        if (refresh.data?.data) {
          setPaymentModes(refresh.data.data);
          setSuggestions(refresh.data.suggestions || []);
        }
      }
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to create payment mode');
    } finally {
      setAddingMode(false);
    }
  };

  // Toggle Mode Active/Inactive
  const handleToggleMode = async (id) => {
    try {
      const res = await api.put(`/admin/payment-modes/${id}/toggle`);
      if (res.data?.success) {
        setPaymentModes((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isActive: res.data.data.isActive } : m))
        );
        toastSuccess(res.data.message);
      }
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to toggle mode');
    }
  };

  // Delete Payment Mode
  const handleDeleteMode = async (id, name) => {
    const confirmed = await confirmDialog({
      title: `Delete "${name}"?`,
      text: 'Are you sure you want to remove this payment mode from your store checkout?',
      confirmText: 'Yes, Delete',
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/admin/payment-modes/${id}`);
      if (res.data?.success) {
        toastSuccess(res.data.message);
        const refresh = await api.get('/admin/payment-modes');
        if (refresh.data?.data) {
          setPaymentModes(refresh.data.data);
          setSuggestions(refresh.data.suggestions || []);
        }
      }
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to delete payment mode');
    }
  };

  return (
    <AppLayout
      title="Store Bill & Payment Settings"
      subtitle="Header, Footer, Paper Size & Payment Modes"
      backTo="/store"
      actionButton={
        activeTab !== 'PAYMENT_MODES' && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        )
      }
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Navigation Tabs (Header | Footer | Payment Modes | Preview) */}
        <div className="grid grid-cols-4 gap-1 bg-slate-200/70 p-1 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('HEADER')}
            className={`py-2 rounded-xl transition-all ${activeTab === 'HEADER'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Header
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FOOTER')}
            className={`py-2 rounded-xl transition-all ${activeTab === 'FOOTER'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Footer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PAYMENT_MODES')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'PAYMENT_MODES'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <span>Payment Modes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              {paymentModes.filter((m) => m.isActive).length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PREVIEW')}
            className={`py-2 rounded-xl transition-all ${activeTab === 'PREVIEW'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Preview
          </button>
        </div>

        {loading ? (
          <BillSettingsSkeleton />
        ) : (
          <div>
            {/* TAB 1: HEADER SETTINGS */}
            {activeTab === 'HEADER' && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Receipt Header Configuration
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Header Title</label>
                    <input
                      type="text"
                      value={settings.headerTitle}
                      onChange={(e) => setSettings({ ...settings, headerTitle: e.target.value })}
                      placeholder="TAX INVOICE / RETAIL INVOICE"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Business / Store Name</label>
                      <input
                        type="text"
                        value={settings.businessName}
                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                        placeholder="Apex Mega Mart"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tagline / Motto</label>
                      <input
                        type="text"
                        value={settings.tagline}
                        onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                        placeholder="Best Quality Groceries & Household Needs"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Store Address (Printed on Receipt)</label>
                    <textarea
                      rows={2}
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      placeholder="Shop 101, Central Market, MG Road, Mumbai"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Store GSTIN</label>
                      <input
                        type="text"
                        value={settings.gstin}
                        onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                        placeholder="27AABCT3518Q1ZY"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 uppercase focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Print Visibility Toggles */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase">Show on Print:</span>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showAddress}
                          onChange={(e) => setSettings({ ...settings, showAddress: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Print Address</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showPhone}
                          onChange={(e) => setSettings({ ...settings, showPhone: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Print Phone</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showGstin}
                          onChange={(e) => setSettings({ ...settings, showGstin: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Print GSTIN</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Header Configuration'}</span>
                </button>
              </form>
            )}

            {/* TAB 2: FOOTER SETTINGS */}
            {activeTab === 'FOOTER' && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Receipt Footer & UPI QR Configuration
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID for Dynamic Payment QR</label>
                    <input
                      type="text"
                      value={settings.upiId}
                      onChange={(e) => setSettings({ ...settings, upiId: e.target.value.toLowerCase().trim() })}
                      placeholder="merchantname@okaxis"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Printed on thermal receipts so customers can scan & pay</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Thank You / Footer Note</label>
                    <input
                      type="text"
                      value={settings.footerMessage}
                      onChange={(e) => setSettings({ ...settings, footerMessage: e.target.value })}
                      placeholder="Thank You for Shopping With Us! Visit Again 🙏"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Conditions</label>
                    <textarea
                      rows={3}
                      value={settings.termsAndConditions}
                      onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                      placeholder="1. Goods once sold cannot be returned without bill."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Signatory Label</label>
                    <input
                      type="text"
                      value={settings.authorizedSignatoryText}
                      onChange={(e) => setSettings({ ...settings, authorizedSignatoryText: e.target.value })}
                      placeholder="Authorized Signatory"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Footer Configuration'}</span>
                </button>
              </form>
            )}

            {/* TAB 3: PAYMENT MODES (ADMIN CUSTOM & 1-CLICK SUGGESTIONS) */}
            {activeTab === 'PAYMENT_MODES' && (
              <div className="space-y-4">
                {/* 1-Click Suggestions Section */}
                {suggestions.length > 0 && (
                  <div className="bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-white rounded-3xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Suggested Payment Modes (1-Click Add)
                        </h3>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Tap to create instantly
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Admin apne counter ke liye niche diye gaye kisi bhi payment mode par click karke instant create kar sakta hai:
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {suggestions.map((s) => {
                        const Icon = getModeIcon(s.icon);
                        return (
                          <button
                            key={s.code}
                            type="button"
                            onClick={() => handleAddSuggestion(s)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-emerald-600 hover:text-white border border-slate-200 hover:border-emerald-600 rounded-2xl text-xs font-bold text-slate-800 shadow-2xs transition-all active:scale-95 group"
                          >
                            <Icon className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white transition-colors" />
                            <span>+ {s.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Create Custom Payment Mode Form */}
                <form
                  onSubmit={handleCreateCustom}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Create Custom Payment Mode</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">Store-Specific / Multi-Tenant Safe</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newModeName}
                      onChange={(e) => setNewModeName(e.target.value)}
                      placeholder="e.g. Sodexo Meal Card, Bajaj Finserv, GPay Soundbox..."
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={addingMode || !newModeName.trim()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all shrink-0"
                    >
                      {addingMode ? 'Adding...' : '+ Add Mode'}
                    </button>
                  </div>
                </form>

                {/* Current Active & Inactive Payment Modes */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Configured Store Payment Modes ({paymentModes.length})</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">Controls modes shown in Checkout</span>
                  </div>

                  {paymentModes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">No payment modes added yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {paymentModes.map((mode) => {
                        const Icon = getModeIcon(mode.icon);
                        return (
                          <div
                            key={mode.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${mode.isActive
                              ? 'bg-white border-slate-200/80 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200/40 opacity-60'
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${mode.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'
                                  }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-xs text-slate-900 truncate">
                                    {mode.name}
                                  </span>
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                                    {mode.code}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {mode.description || 'Custom store payment option'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleMode(mode.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${mode.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-200 text-slate-600'
                                  }`}
                              >
                                {mode.isActive ? 'Active' : 'Disabled'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteMode(mode.id, mode.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

            {/* TAB 4: LIVE PREVIEW */}
            {activeTab === 'PREVIEW' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Thermal Print Preview (80mm)
                  </h3>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Test</span>
                  </button>
                </div>

                {/* Receipt Mock */}
                <div className="max-w-xs mx-auto p-4 bg-white border border-slate-300 rounded-2xl font-mono text-[11px] text-slate-900 space-y-3 shadow-xs">
                  <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                    <p className="font-extrabold text-xs uppercase tracking-wide">{settings.headerTitle}</p>
                    <h2 className="font-black text-sm uppercase">{settings.businessName || 'YOUR STORE NAME'}</h2>
                    {settings.tagline && <p className="text-[10px] text-slate-600 italic">{settings.tagline}</p>}
                    {settings.showAddress && settings.address && (
                      <p className="text-[10px] text-slate-600 leading-tight">{settings.address}</p>
                    )}
                    {settings.showPhone && settings.phone && (
                      <p className="text-[10px] text-slate-800 font-bold">Ph: {settings.phone}</p>
                    )}
                    {settings.showGstin && settings.gstin && (
                      <p className="text-[10px] text-slate-800 font-bold">GSTIN: {settings.gstin}</p>
                    )}
                  </div>

                  <div className="flex justify-between text-[10px] py-1 border-b border-dashed border-slate-300">
                    <div>
                      <p className="font-bold">Bill: INV-SAMPLE-101</p>
                      <p>Customer: Walk-in Customer</p>
                    </div>
                    <div className="text-right">
                      <p>{new Date().toLocaleDateString('en-IN')}</p>
                      <p className="font-bold text-emerald-700">CASH (PAID)</p>
                    </div>
                  </div>

                  <div className="space-y-1 py-1 border-b border-dashed border-slate-400 text-[10px]">
                    <div className="flex justify-between">
                      <span>1. Cadbury Silk 60g</span>
                      <span>1 x ₹85</span>
                      <span>₹85.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2. Amul Butter 100g</span>
                      <span>2 x ₹56</span>
                      <span>₹112.00</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right text-[10px]">
                    <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-800">
                      <span>TOTAL AMOUNT:</span>
                      <span>₹197.00</span>
                    </div>
                  </div>

                  <div className="text-center pt-2 border-t border-dashed border-slate-400 space-y-1.5">
                    {settings.upiId && (
                      <p className="text-[10px] bg-slate-100 p-1 rounded font-bold">Pay via UPI: {settings.upiId}</p>
                    )}
                    {settings.footerMessage && (
                      <p className="font-bold text-[10px] text-slate-900">{settings.footerMessage}</p>
                    )}
                    {settings.termsAndConditions && (
                      <p className="text-[8.5px] text-slate-500 whitespace-pre-line text-left border-t border-dotted border-slate-300 pt-1">
                        {settings.termsAndConditions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
