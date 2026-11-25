import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import {
  Receipt,
  Save,
  CheckCircle2,
  Printer,
  Sparkles,
  Sliders,
  Store,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/alerts';

export default function BillSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('HEADER'); // 'HEADER' | 'FOOTER' | 'PREVIEW'

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

  useEffect(() => {
    api
      .get('/admin/bill-settings')
      .then((res) => {
        if (res.data?.data) {
          setSettings((prev) => ({ ...prev, ...res.data.data }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
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

  return (
    <AppLayout
      title="Bill Print Settings"
      subtitle="Header, Footer & Thermal Receipt"
      backTo="/profile"
      actionButton={
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      }
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('HEADER')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'HEADER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bill Header
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FOOTER')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'FOOTER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bill Footer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PREVIEW')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'PREVIEW'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Preview
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading bill configuration...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* TAB 1: HEADER SETTINGS */}
            {activeTab === 'HEADER' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Receipt Header Content
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Printed at the top of every customer invoice
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Invoice Top Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TAX INVOICE / RETAIL CASH MEMO"
                    value={settings.headerTitle}
                    onChange={(e) => setSettings({ ...settings, headerTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business / Store Name on Bill *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahavir Supermarket"
                    value={settings.businessName}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tagline / Subheading
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Quality Groceries & Daily Needs"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Address on Bill
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Shop #4, Market Yard, Pune - 411037"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Billing Phone / Mobile
                    </label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      placeholder="27AABCT3518Q1ZY"
                      value={settings.gstin}
                      onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Display Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">Show Address on Receipt</span>
                    <input
                      type="checkbox"
                      checked={settings.showAddress}
                      onChange={(e) => setSettings({ ...settings, showAddress: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">Show Phone Number on Receipt</span>
                    <input
                      type="checkbox"
                      checked={settings.showPhone}
                      onChange={(e) => setSettings({ ...settings, showPhone: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">Show GSTIN Number on Receipt</span>
                    <input
                      type="checkbox"
                      checked={settings.showGstin}
                      onChange={(e) => setSettings({ ...settings, showGstin: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: FOOTER SETTINGS */}
            {activeTab === 'FOOTER' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Receipt Footer Content
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Printed at the bottom of every customer invoice
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Greeting / Footer Note
                  </label>
                  <input
                    type="text"
                    placeholder="Thank You for Shopping With Us! Visit Again 🙏"
                    value={settings.footerMessage}
                    onChange={(e) => setSettings({ ...settings, footerMessage: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Terms & Conditions (Lines printed at bottom)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="1. Goods once sold cannot be returned.\n2. No refund without bill."
                    value={settings.termsAndConditions}
                    onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UPI Payment ID (Optional for UPI QR/text)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. shopname@upi or 9876543210@paytm"
                    value={settings.upiId}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Signatory Text
                    </label>
                    <input
                      type="text"
                      placeholder="Authorized Signatory"
                      value={settings.authorizedSignatoryText}
                      onChange={(e) => setSettings({ ...settings, authorizedSignatoryText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Paper Size Format
                    </label>
                    <select
                      value={settings.paperSize}
                      onChange={(e) => setSettings({ ...settings, paperSize: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="THERMAL_80MM">Thermal 80mm (Standard POS)</option>
                      <option value="THERMAL_58MM">Thermal 58mm (Small)</option>
                      <option value="A4">A4 / Full Sheet</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <span className="text-xs font-bold text-slate-700">Show Signatory Box at Bottom</span>
                  <input
                    type="checkbox"
                    checked={settings.showSignatory}
                    onChange={(e) => setSettings({ ...settings, showSignatory: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </label>
              </div>
            )}

            {/* TAB 3: LIVE RECEIPT PREVIEW */}
            {activeTab === 'PREVIEW' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">Live Receipt Visualizer</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{settings.paperSize}</span>
                </div>

                {/* Thermal Receipt Paper Card */}
                <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-300 shadow-xl font-mono text-[11px] text-slate-800 space-y-3 max-w-sm mx-auto">
                  {/* RECEIPT HEADER */}
                  <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                    <p className="font-extrabold text-sm uppercase tracking-wide text-slate-950">
                      {settings.headerTitle || 'TAX INVOICE'}
                    </p>
                    <h2 className="font-black text-base uppercase text-slate-950 leading-tight">
                      {settings.businessName || 'MY STORE'}
                    </h2>
                    {settings.tagline && (
                      <p className="text-[10px] text-slate-600 italic">{settings.tagline}</p>
                    )}
                    {settings.showAddress && settings.address && (
                      <p className="text-[10px] text-slate-600 leading-tight">{settings.address}</p>
                    )}
                    {settings.showPhone && settings.phone && (
                      <p className="text-[10px] text-slate-700 font-bold">Ph: {settings.phone}</p>
                    )}
                    {settings.showGstin && settings.gstin && (
                      <p className="text-[10px] text-slate-800 font-bold">GSTIN: {settings.gstin}</p>
                    )}
                  </div>

                  {/* INVOICE META */}
                  <div className="flex justify-between text-[10px] py-1 border-b border-dashed border-slate-300">
                    <div>
                      <p>Inv: INV-20261125-1048</p>
                      <p>Customer: Ramesh Kumar</p>
                    </div>
                    <div className="text-right">
                      <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
                      <p>Time: 04:50 PM</p>
                    </div>
                  </div>

                  {/* SAMPLE ITEMS TABLE */}
                  <div className="space-y-1.5 py-2 border-b border-dashed border-slate-400 text-[10px]">
                    <div className="flex justify-between font-bold border-b border-slate-200 pb-1">
                      <span>Item</span>
                      <span>Qty x Rate</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate max-w-[120px]">Basmati Rice 5kg</span>
                      <span>1 x ₹350</span>
                      <span className="font-bold">₹350.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate max-w-[120px]">Tata Gold Tea 500g</span>
                      <span>2 x ₹240</span>
                      <span className="font-bold">₹480.00</span>
                    </div>
                  </div>

                  {/* TOTALS */}
                  <div className="space-y-1 text-right text-[10px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal:</span>
                      <span>₹830.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Discount:</span>
                      <span>- ₹30.00</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-slate-950 pt-1 border-t border-slate-800">
                      <span>GRAND TOTAL:</span>
                      <span>₹800.00</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>Payment Mode:</span>
                      <span className="font-bold">CASH (PAID)</span>
                    </div>
                  </div>

                  {/* RECEIPT FOOTER */}
                  <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-2">
                    {settings.upiId && (
                      <p className="text-[10px] bg-slate-100 p-1 rounded font-bold">
                        Pay via UPI: {settings.upiId}
                      </p>
                    )}

                    {settings.footerMessage && (
                      <p className="font-bold text-[10px] text-slate-900">
                        {settings.footerMessage}
                      </p>
                    )}

                    {settings.termsAndConditions && (
                      <div className="text-[9px] text-slate-500 whitespace-pre-line text-left border-t border-dotted border-slate-300 pt-1.5">
                        <span className="font-bold block uppercase text-slate-700">Terms & Conditions:</span>
                        {settings.termsAndConditions}
                      </div>
                    )}

                    {settings.showSignatory && (
                      <div className="pt-4 text-right">
                        <p className="border-t border-slate-400 inline-block px-4 text-[9px] font-bold text-slate-700">
                          {settings.authorizedSignatoryText || 'Authorized Signatory'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save Header & Footer Configuration'}</span>
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
