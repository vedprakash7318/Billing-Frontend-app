import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Receipt,
  User,
  Printer,
  CheckCircle2,
  X,
  MessageSquare,
  MessageCircle,
  ExternalLink,
  Copy,
  Plus,
  Minus,
  ShoppingBag,
  Banknote,
  QrCode,
  CreditCard,
  BookOpen,
  Phone,
  Sparkles,
  ArrowLeft,
  Share2,
  Smartphone,
  Landmark,
  FileText,
  Tag,
  Wallet,
} from 'lucide-react';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/alerts';

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

export default function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pos_cart') || '[]');
    } catch {
      return [];
    }
  });

  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [deliveryMethod, setDeliveryMethod] = useState('PRINT'); // 'SMS' | 'WHATSAPP' | 'PRINT'
  const [notes, setNotes] = useState('');

  const [generating, setGenerating] = useState(false);
  const [printedInvoice, setPrintedInvoice] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [quotas, setQuotas] = useState(null);
  const [paymentModes, setPaymentModes] = useState([]);

  useEffect(() => {
    // 1. Load store active payment modes
    api
      .get('/admin/payment-modes')
      .then((res) => {
        if (res.data?.data) {
          const activeModes = res.data.data.filter((m) => m.isActive);
          setPaymentModes(activeModes);
          const defaultMode = activeModes.find((m) => m.isDefault) || activeModes[0];
          if (defaultMode) {
            setPaymentMode(defaultMode.code);
          }
        }
      })
      .catch((err) => console.error('Failed to load payment modes:', err));

    // 2. Load quota statuses
    api
      .get('/admin/subscription')
      .then((res) => {
        if (res.data?.data?.quotas) {
          setQuotas(res.data.data.quotas);
          // Auto-fallback if active choice is disabled
          if (res.data.data.quotas.isSmsGloballyEnabled === false && deliveryMethod === 'SMS') {
            setDeliveryMethod('PRINT');
          }
          if (res.data.data.quotas.isWhatsAppGloballyEnabled === false && deliveryMethod === 'WHATSAPP') {
            setDeliveryMethod('PRINT');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Sync cart changes back to localStorage and notify layout
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('pos_cart_updated'));
  }, [cart]);

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      updated[index].quantity = newQty;
      updated[index].total = Math.round(newQty * updated[index].price * 100) / 100;
      setCart(updated);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Total savings from MRP
  const totalMrpSavings = cart.reduce((sum, item) => {
    const diff = (item.mrp || item.price) - item.price;
    return sum + (diff > 0 ? diff * item.quantity : 0);
  }, 0);

  // Quick discount setters
  const applyPercentDiscount = (percent) => {
    const disc = Math.round((subtotal * percent) / 100);
    setDiscount(disc);
  };

  const handleFinalizeBill = async () => {
    if (cart.length === 0) {
      toastError('Your cart is empty.');
      navigate('/billing');
      return;
    }

    if ((deliveryMethod === 'SMS' || deliveryMethod === 'WHATSAPP') && (!customerPhone || customerPhone.trim().length < 10)) {
      toastError(`Please enter a valid 10-digit mobile number for ${deliveryMethod}.`);
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        items: cart,
        subtotal,
        discount: discountAmount,
        grandTotal,
        paymentMode,
        paymentStatus: 'PAID',
        deliveryMethod,
        clientOrigin: window.location.origin,
        notes: notes.trim(),
      };

      const res = await api.post('/admin/invoices', payload);
      if (res.data?.success) {
        const inv = res.data.data;
        setPrintedInvoice(inv);
        setShowResultModal(true);
        toastSuccess(res.data.message || `Invoice ${inv.invoiceNumber} saved!`);

        // If WhatsApp, open WhatsApp web/app link
        if (deliveryMethod === 'WHATSAPP' && inv.whatsappUrl) {
          window.open(inv.whatsappUrl, '_blank', 'noopener,noreferrer');
        }

        // If Print, trigger window.print() automatically after modal renders
        if (deliveryMethod === 'PRINT') {
          setTimeout(() => {
            window.print();
          }, 400);
        }

        // Clear cart
        setCart([]);
        localStorage.removeItem('pos_cart');
        window.dispatchEvent(new Event('pos_cart_updated'));
      }
    } catch (err) {
      toastError(err.response?.data?.error || err.message || 'Failed to generate bill');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    toastSuccess('Receipt link copied!');
  };

  const handleDoneAndNew = () => {
    setShowResultModal(false);
    navigate('/billing');
  };

  if (cart.length === 0 && !showResultModal) {
    return (
      <AppLayout title="Checkout" subtitle="Step 2: Finalize Bill" backTo="/billing" hideBottomNav={true}>
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm space-y-3 mt-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No items in cart</h3>
          <p className="text-xs text-slate-500">Please select products first before proceeding to checkout.</p>
          <Link
            to="/billing"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Product Selection</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Review & Checkout"
      subtitle="Step 2: Customer & Payment"
      backTo="/billing"
      hideBottomNav={true}
    >
      <div className="max-w-2xl mx-auto space-y-4 pb-12">

        {/* 1. ORDER SUMMARY CARD */}
        <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Items ({cart.length})
              </h3>
            </div>
            <Link
              to="/billing"
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>+ Add More</span>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 space-y-2">
            {cart.map((item, idx) => (
              <div key={idx} className="pt-2 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-400">
                    ₹{item.price} × {item.quantity}
                    {item.mrp && item.mrp > item.price && (
                      <span className="ml-1 text-emerald-600 font-bold">
                        (Save ₹{((item.mrp - item.price) * item.quantity).toFixed(0)})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateQuantity(idx, -1)}
                    className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center text-xs font-bold shadow-2xs hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-black text-xs text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(idx, 1)}
                    className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center text-xs font-bold shadow-2xs hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="font-black text-slate-900 min-w-[60px] text-right">
                  ₹{item.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing & Discount Controls */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
            {totalMrpSavings > 0 && (
              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl font-bold border border-emerald-200/60">
                <span>Product Discounts on MRP:</span>
                <span className="font-black text-emerald-700">- ₹{totalMrpSavings.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Quick Discount Pill Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Discount:</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-20 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-rose-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Fast Discount Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar justify-end">
                <button
                  type="button"
                  onClick={() => setDiscount(0)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                    discountAmount === 0 ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ₹0
                </button>
                <button
                  type="button"
                  onClick={() => setDiscount(10)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                >
                  ₹10
                </button>
                <button
                  type="button"
                  onClick={() => setDiscount(20)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                >
                  ₹20
                </button>
                <button
                  type="button"
                  onClick={() => applyPercentDiscount(5)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                >
                  5%
                </button>
                <button
                  type="button"
                  onClick={() => applyPercentDiscount(10)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                >
                  10%
                </button>
              </div>
            </div>

            {/* Final Grand Total */}
            <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-900 text-slate-900">
              <span className="text-xs font-black uppercase tracking-wider">FINAL AMOUNT:</span>
              <span className="text-xl font-black text-emerald-700">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 2. CUSTOMER DETAILS */}
        <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <User className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Customer Details
            </h3>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Customer Mobile</span>
                </label>
                {deliveryMethod !== 'PRINT' ? (
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Required for {deliveryMethod}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">(Optional)</span>
                )}
              </div>
              <input
                type="tel"
                maxLength={10}
                placeholder="Enter 10-digit mobile number..."
                value={customerPhone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.startsWith('91') && val.length > 10) {
                    val = val.slice(2);
                  }
                  setCustomerPhone(val.slice(0, 10));
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono font-bold ${
                  deliveryMethod !== 'PRINT' && (!customerPhone || customerPhone.length < 10)
                    ? 'border-amber-400 bg-amber-50/30'
                    : 'border-slate-200'
                }`}
              />
            </div>
          </div>
        </div>

        {/* 3. PAYMENT MODE & 3 RECEIPT OPTIONS */}
        <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs space-y-4">
          
          {/* Payment Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider">
                Payment Mode
              </label>
              <Link
                to="/bill-settings"
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>⚙️ Manage Modes</span>
              </Link>
            </div>

            {paymentModes.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-400 text-center">
                Loading store payment modes...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {paymentModes.map((m) => {
                  const Icon = getModeIcon(m.icon);
                  const isSelected = paymentMode === m.code;
                  return (
                    <button
                      key={m.id || m.code}
                      type="button"
                      onClick={() => setPaymentMode(m.code)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-slate-950 text-white border-slate-950 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/10 text-emerald-400' : 'bg-white text-slate-600 shadow-2xs'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3 Receipt Options: SMS, WhatsApp, Print */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 mb-2 uppercase tracking-wider">
              Receipt Action (Choose 1)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* SMS Button */}
              <button
                type="button"
                disabled={quotas?.isSmsGloballyEnabled === false}
                onClick={() => setDeliveryMethod('SMS')}
                className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  quotas?.isSmsGloballyEnabled === false
                    ? 'opacity-60 cursor-not-allowed bg-slate-100/90 border-dashed border-amber-300 text-slate-400'
                    : deliveryMethod === 'SMS'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-300 active:scale-95'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:scale-95'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${
                  quotas?.isSmsGloballyEnabled === false
                    ? 'bg-amber-100 text-amber-700'
                    : deliveryMethod === 'SMS'
                    ? 'bg-white/20'
                    : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span>SMS Link</span>
                {quotas && (
                  <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                    quotas.isSmsGloballyEnabled === false
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : quotas.smsBalance <= 0
                      ? 'bg-rose-100 text-rose-800'
                      : deliveryMethod === 'SMS'
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {quotas.isSmsGloballyEnabled === false ? '⚠️ Temp Band' : `${quotas.smsBalance} left`}
                  </span>
                )}
              </button>

              {/* WhatsApp Button */}
              <button
                type="button"
                disabled={quotas?.isWhatsAppGloballyEnabled === false}
                onClick={() => setDeliveryMethod('WHATSAPP')}
                className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  quotas?.isWhatsAppGloballyEnabled === false
                    ? 'opacity-60 cursor-not-allowed bg-slate-100/90 border-dashed border-amber-300 text-slate-400'
                    : deliveryMethod === 'WHATSAPP'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-300 active:scale-95'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:scale-95'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${
                  quotas?.isWhatsAppGloballyEnabled === false
                    ? 'bg-amber-100 text-amber-700'
                    : deliveryMethod === 'WHATSAPP'
                    ? 'bg-white/20'
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span>WhatsApp</span>
                {quotas && (
                  <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                    quotas.isWhatsAppGloballyEnabled === false
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : quotas.whatsAppBalance <= 0
                      ? 'bg-rose-100 text-rose-800'
                      : deliveryMethod === 'WHATSAPP'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {quotas.isWhatsAppGloballyEnabled === false ? '⚠️ Temp Band' : `${quotas.whatsAppBalance} left`}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('PRINT')}
                className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                  deliveryMethod === 'PRINT'
                    ? 'bg-slate-950 text-white border-slate-950 shadow-lg shadow-slate-950/25 ring-2 ring-slate-400'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${deliveryMethod === 'PRINT' ? 'bg-white/20' : 'bg-slate-200 text-slate-800'}`}>
                  <Printer className="w-4 h-4" />
                </div>
                <span>Print Bill</span>
              </button>
            </div>
          </div>

          {/* Dynamic Final Submission Button */}
          {deliveryMethod === 'SMS' && (
            <div className="space-y-2">
              {quotas?.isSmsGloballyEnabled === false && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800">
                  ⚠️ {quotas?.smsDisabledNotice || 'SMS service is temporarily paused by Admin for maintenance.'}
                </div>
              )}
              {quotas && quotas.isSmsGloballyEnabled !== false && quotas.smsBalance <= 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] text-rose-800 flex items-center justify-between">
                  <span>⚠️ Store SMS quota is 0.</span>
                  <Link to="/subscription#booster-packs" className="font-bold underline text-indigo-700">Recharge Pack</Link>
                </div>
              )}
              <button
                type="button"
                disabled={generating || quotas?.isSmsGloballyEnabled === false || (quotas && quotas.smsBalance <= 0)}
                onClick={handleFinalizeBill}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{generating ? 'Saving & Sending SMS...' : `Save & Send SMS (₹${grandTotal.toFixed(2)})`}</span>
              </button>
            </div>
          )}

          {deliveryMethod === 'WHATSAPP' && (
            <div className="space-y-2">
              {quotas?.isWhatsAppGloballyEnabled === false && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800">
                  ⚠️ {quotas?.whatsAppDisabledNotice || 'WhatsApp messaging is temporarily paused by Admin for maintenance.'}
                </div>
              )}
              {quotas && quotas.isWhatsAppGloballyEnabled !== false && quotas.whatsAppBalance <= 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] text-rose-800 flex items-center justify-between">
                  <span>⚠️ Store WhatsApp quota is 0.</span>
                  <Link to="/subscription#booster-packs" className="font-bold underline text-emerald-700">Recharge Pack</Link>
                </div>
              )}
              <button
                type="button"
                disabled={generating || quotas?.isWhatsAppGloballyEnabled === false || (quotas && quotas.whatsAppBalance <= 0)}
                onClick={handleFinalizeBill}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{generating ? 'Saving & Opening WhatsApp...' : `Save & Send WhatsApp (₹${grandTotal.toFixed(2)})`}</span>
              </button>
            </div>
          )}

          {deliveryMethod === 'PRINT' && (
            <button
              type="button"
              disabled={generating}
              onClick={handleFinalizeBill}
              className="w-full py-4 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white font-black text-xs rounded-2xl shadow-xl shadow-slate-950/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{generating ? 'Saving & Preparing Print...' : `Save & Print Bill (₹${grandTotal.toFixed(2)})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* RESULT & THERMAL RECEIPT MODAL */}
      {showResultModal && printedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-black">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Invoice #{printedInvoice.invoiceNumber} Saved</span>
              </div>
              <button
                onClick={handleDoneAndNew}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Delivery Status Banner */}
            {printedInvoice.receiptUrl && (
              <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-2 text-[11px] shrink-0">
                <div className="min-w-0">
                  <p className="font-extrabold text-emerald-900 leading-tight">
                    {printedInvoice.deliveryMethod === 'SMS'
                      ? `SMS Dispatched to ${printedInvoice.customerPhone}`
                      : printedInvoice.deliveryMethod === 'WHATSAPP'
                      ? `WhatsApp Ready for ${printedInvoice.customerPhone}`
                      : 'Digital Receipt Created'}
                  </p>
                  <a
                    href={printedInvoice.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline truncate block font-mono text-[10px] mt-0.5"
                  >
                    {printedInvoice.receiptUrl}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyLink(printedInvoice.receiptUrl)}
                  className="p-1.5 bg-white border border-emerald-300 rounded-lg text-emerald-700 hover:bg-emerald-100 shrink-0 shadow-2xs"
                  title="Copy Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Printable Thermal Receipt */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto font-mono text-[11px] text-slate-900 space-y-3 print-receipt-area bg-white">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                <p className="font-black text-xs uppercase tracking-wide">
                  {printedInvoice.billSnapshot?.headerTitle || 'TAX INVOICE'}
                </p>
                <h2 className="font-black text-base uppercase leading-tight text-slate-950">
                  {printedInvoice.billSnapshot?.businessName || 'BILLING STORE'}
                </h2>
                {printedInvoice.billSnapshot?.tagline && (
                  <p className="text-[10px] text-slate-600 italic">
                    {printedInvoice.billSnapshot?.tagline}
                  </p>
                )}
                {printedInvoice.billSnapshot?.showAddress && printedInvoice.billSnapshot?.address && (
                  <p className="text-[10px] text-slate-600 leading-tight">
                    {printedInvoice.billSnapshot?.address}
                  </p>
                )}
                {printedInvoice.billSnapshot?.showPhone && printedInvoice.billSnapshot?.phone && (
                  <p className="text-[10px] text-slate-800 font-bold">
                    Ph: {printedInvoice.billSnapshot?.phone}
                  </p>
                )}
                {printedInvoice.billSnapshot?.showGstin && printedInvoice.billSnapshot?.gstin && (
                  <p className="text-[10px] text-slate-800 font-bold">
                    GSTIN: {printedInvoice.billSnapshot?.gstin}
                  </p>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="flex justify-between text-[10px] py-1 border-b border-dashed border-slate-300">
                <div>
                  <p className="font-bold">Bill: #{printedInvoice.invoiceNumber}</p>
                  <p>Customer: {printedInvoice.customerName}</p>
                  {printedInvoice.customerPhone && <p>Ph: {printedInvoice.customerPhone}</p>}
                </div>
                <div className="text-right">
                  <p>Date: {new Date(printedInvoice.createdAt).toLocaleDateString('en-IN')}</p>
                  <p>
                    Time:{' '}
                    {new Date(printedInvoice.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="font-bold text-emerald-700">{printedInvoice.paymentMode} (PAID)</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-400 text-[10px]">
                <div className="flex justify-between font-black border-b border-slate-300 pb-1">
                  <span>Item</span>
                  <span>Qty × Rate</span>
                  <span className="text-right">Amount</span>
                </div>
                {printedInvoice.items?.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-[125px] font-medium">{it.title}</span>
                    <span>
                      {it.quantity} × ₹{it.price}
                    </span>
                    <span className="font-black text-right">₹{it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-right text-[10px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{printedInvoice.subtotal?.toFixed(2)}</span>
                </div>
                {printedInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Discount:</span>
                    <span>- ₹{printedInvoice.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black text-slate-950 pt-1 border-t border-slate-900">
                  <span>TOTAL PAID:</span>
                  <span>₹{printedInvoice.grandTotal?.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer / QR / Sign */}
              <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-2">
                {printedInvoice.billSnapshot?.upiId && (
                  <p className="text-[10px] bg-slate-100 p-1 rounded font-bold">
                    UPI: {printedInvoice.billSnapshot?.upiId}
                  </p>
                )}
                {printedInvoice.billSnapshot?.footerMessage && (
                  <p className="font-bold text-[10px] text-slate-950">
                    {printedInvoice.billSnapshot?.footerMessage}
                  </p>
                )}
                {printedInvoice.billSnapshot?.termsAndConditions && (
                  <div className="text-[8.5px] text-slate-500 whitespace-pre-line text-left border-t border-dotted border-slate-300 pt-1">
                    <span className="font-bold block uppercase text-slate-700">Terms:</span>
                    {printedInvoice.billSnapshot?.termsAndConditions}
                  </div>
                )}
                {printedInvoice.billSnapshot?.showSignatory && (
                  <div className="pt-3 text-right">
                    <p className="border-t border-slate-400 inline-block px-3 text-[9px] font-bold text-slate-700">
                      {printedInvoice.billSnapshot?.authorizedSignatoryText || 'Authorized Signatory'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions inside Modal */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
              {printedInvoice.whatsappUrl && (
                <a
                  href={printedInvoice.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Again</span>
              </button>
              <button
                type="button"
                onClick={handleDoneAndNew}
                className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                New Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Thermal Paper Print Media Query */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt-area, .print-receipt-area * {
            visibility: visible;
          }
          .print-receipt-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
