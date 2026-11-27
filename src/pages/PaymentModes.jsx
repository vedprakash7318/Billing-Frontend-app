import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wallet,
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

export default function PaymentModes() {
  const [loading, setLoading] = useState(true);
  const [paymentModes, setPaymentModes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [newModeName, setNewModeName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      const [modesRes, billRes] = await Promise.all([
        api.get('/admin/payment-modes'),
        api.get('/admin/bill-settings').catch(() => ({ data: {} })),
      ]);

      if (modesRes.data?.success) {
        setPaymentModes(modesRes.data.data || []);
        setSuggestions(modesRes.data.suggestions || []);
      }
      if (billRes.data?.success && billRes.data.data) {
        setUpiId(billRes.data.data.upiId || '');
      }
    } catch (err) {
      console.error('Failed to load payment modes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

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
        showSuccess(`Payment mode "${sugg.name}" added successfully!`);
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to add payment mode');
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
        showSuccess(`Custom payment mode "${newModeName.trim()}" created!`);
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to add custom payment mode');
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
      showError(err.response?.data?.error || 'Failed to toggle mode');
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
        showSuccess(`Payment mode "${name}" deleted`);
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete payment mode');
    }
  };

  const handleSaveUpiId = async () => {
    setSavingUpi(true);
    try {
      const res = await api.put('/admin/bill-settings', { upiId: upiId.trim() });
      if (res.data?.success) {
        showSuccess('Store UPI ID saved! QR code will appear on customer invoices.');
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save UPI ID');
    } finally {
      setSavingUpi(false);
    }
  };

  return (
    <AppLayout
      title="Store Payment Modes"
      subtitle="POS Methods & Invoice QR"
      backTo="/profile"
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

        {/* 1. Store UPI ID / QR Configuration */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Store UPI ID for Dynamic QR
              </h3>
              <p className="text-[10px] text-slate-400">
                Printed on thermal receipt so customers can scan with GPay / PhonePe / Paytm
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
              disabled={savingUpi}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm"
            >
              {savingUpi ? 'Saving...' : 'Save UPI'}
            </button>
          </div>
        </div>

        {/* 2. 1-Click Popular Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Quick Add Suggestions (1-Click)
              </h4>
              <p className="text-[10px] text-slate-400">
                Tap any mode below to instantly enable it for your store:
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
            Create Custom Payment Mode
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
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm flex items-center gap-1"
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
              Active Store Modes ({paymentModes.length})
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">Used at POS Checkout</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading payment modes...</div>
          ) : paymentModes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No payment modes configured. Tap suggestions above to add standard modes.
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
    </AppLayout>
  );
}
