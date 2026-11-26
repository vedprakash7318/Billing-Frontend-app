import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Zap,
  ShieldCheck,
  CreditCard,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Smartphone,
  QrCode,
  Layers,
  MessageSquare,
  MessageCircle,
  Plus,
  Coins,
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog, toastSuccess, toastError } from '../utils/alerts';

export default function SubscriptionPlans() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);
  const [rechargingId, setRechargingId] = useState(null);
  const [boosterTab, setBoosterTab] = useState('ALL'); // ALL | SMS | WHATSAPP
  const [autoPay, setAutoPay] = useState(false);
  const [autoPayInfo, setAutoPayInfo] = useState({
    isEnabled: false,
    status: 'INACTIVE',
    mandateId: null,
    method: 'UPI',
    authorizedAt: null,
    failureReason: null,
  });
  const [togglingAutoPay, setTogglingAutoPay] = useState(false);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/subscription');
      if (res.data?.success) {
        const payload = res.data.data;
        setData(payload);
        const ap = payload?.autoPay || {};
        const isEn = Boolean(payload?.isAutoPayEnabled || ap.isEnabled);
        setAutoPay(isEn);
        setAutoPayInfo({
          isEnabled: isEn,
          status: ap.status || (isEn ? 'ACTIVE' : 'INACTIVE'),
          mandateId: ap.mandateId || null,
          method: ap.method || 'UPI',
          authorizedAt: ap.authorizedAt || null,
          failureReason: ap.failureReason || null,
        });
      }
    } catch (err) {
      console.error(err);
      toastError(err.response?.data?.error || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  // Real UPI AutoPay Setup via Google Pay / PhonePe / Paytm Mandate
  const handleSetupAutoPay = async () => {
    setTogglingAutoPay(true);
    try {
      const orderRes = await api.post('/admin/subscription/setup-autopay-order');
      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.error || 'Failed to initialize UPI AutoPay mandate');
      }

      const { orderId, amount, currency, keyId, store, plan } = orderRes.data;

      if (!window.Razorpay) {
        throw new Error('Razorpay payment gateway failed to load. Please refresh.');
      }

      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_HGCsLV5PjSYo8F',
        amount,
        currency: currency || 'INR',
        name: store?.name || 'BillFlow Store',
        description: `UPI AutoPay Authorization for ${plan?.name || 'Subscription'}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        order_id: orderId,
        prefill: {
          name: store?.name || 'Store Merchant',
          email: store?.email || '',
          contact: store?.phone || '',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: () => {
            setTogglingAutoPay(false);
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/admin/subscription/verify-autopay-mandate', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              method: 'UPI (Google Pay / PhonePe)',
            });

            if (verifyRes.data?.success) {
              toastSuccess(verifyRes.data.message || '🎉 Google Pay / UPI AutoPay mandate authorized successfully!');
              setAutoPay(true);
              setAutoPayInfo(verifyRes.data.data || { isEnabled: true, status: 'ACTIVE' });
              fetchSubscription();
            } else {
              throw new Error(verifyRes.data?.error || 'Mandate verification failed');
            }
          } catch (verifyErr) {
            toastError(verifyErr.response?.data?.error || verifyErr.message || 'Failed to verify UPI AutoPay mandate');
          } finally {
            setTogglingAutoPay(false);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        toastError(resp.error?.description || 'UPI AutoPay authorization was cancelled or failed.');
        setTogglingAutoPay(false);
      });

      rzpInstance.open();
    } catch (err) {
      toastError(err.response?.data?.error || err.message || 'Unable to start AutoPay setup');
      setTogglingAutoPay(false);
    }
  };

  // Cancel UPI AutoPay Mandate
  const handleCancelAutoPay = async () => {
    const ok = await confirmDialog({
      title: 'Cancel UPI AutoPay Mandate?',
      message: 'Kya aap sure hain ki AutoPay mandate cancel karna chahte hain? Iske baad expiry par auto-debit nahi hoga aur store subscription manually renew karna hoga.',
      confirmText: 'Yes, Cancel AutoPay',
      cancelText: 'Keep Active',
      isDestructive: true,
    });

    if (!ok) return;

    setTogglingAutoPay(true);
    try {
      const res = await api.post('/admin/subscription/cancel-autopay', {
        reason: 'Cancelled by store merchant via dashboard',
      });
      if (res.data?.success) {
        toastSuccess('AutoPay mandate cancelled successfully.');
        setAutoPay(false);
        setAutoPayInfo({ isEnabled: false, status: 'CANCELLED', failureReason: 'Cancelled by store merchant' });
        fetchSubscription();
      }
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to cancel AutoPay mandate');
    } finally {
      setTogglingAutoPay(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleActivatePlan = async (plan) => {
    const isFree = plan.price === 0 || plan.planType === 'FREE_TRIAL' || plan.planType === 'FREE';

    // 1. FREE PLAN / FREE TRIAL ACTIVATION
    if (isFree) {
      const confirmed = await confirmDialog({
        title: `Activate Free Plan?`,
        text: `Activate "${plan.name}" for free? Any remaining days on your current trial will be preserved and stacked!`,
        confirmButtonText: 'Yes, Activate Free Plan',
        confirmButtonColor: '#10b981',
      });

      if (!confirmed) return;

      setActivatingId(plan.id || plan._id);
      try {
        const res = await api.post('/admin/subscription/activate-free', {
          planId: plan.id || plan._id,
        });
        if (res.data?.success) {
          toastSuccess(res.data.message || 'Free Plan activated successfully!');
          fetchSubscription();
        }
      } catch (err) {
        toastError(err.response?.data?.error || 'Failed to activate free plan');
      } finally {
        setActivatingId(null);
      }
      return;
    }

    // 2. PAID PLAN ACTIVATION VIA RAZORPAY (UPI, Cards, NetBanking, QR)
    setActivatingId(plan.id || plan._id);
    try {
      // Step A: Create Razorpay Order on server
      const orderRes = await api.post('/admin/subscription/create-order', {
        planId: plan.id || plan._id,
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.error || 'Failed to initialize Razorpay order');
      }

      const { orderId, amount, currency, keyId, store } = orderRes.data;

      // Ensure Razorpay SDK is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection and refresh.');
      }

      // Step B: Configure Razorpay Checkout options
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_HGCsLV5PjSYo8F',
        amount: amount,
        currency: currency || 'INR',
        name: store?.name || 'BillFlow Store',
        description: `Plan: ${plan.name} (Valid for ${plan.durationValue || 1} ${plan.durationType?.toLowerCase()})`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        order_id: orderId,
        prefill: {
          name: store?.name || 'Store Merchant',
          email: store?.email || '',
          contact: store?.phone || '',
        },
        notes: {
          planId: plan.id || plan._id,
          planName: plan.name,
          autoPay: autoPay ? 'YES' : 'NO',
        },
        theme: {
          color: '#10b981', // Emerald green
        },
        modal: {
          ondismiss: () => {
            setActivatingId(null);
          },
        },
        handler: async (response) => {
          // Step C: Verify Razorpay Signature on backend and activate plan
          try {
            const verifyRes = await api.post('/admin/subscription/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id || plan._id,
              isAutoPayEnabled: autoPay,
            });

            if (verifyRes.data?.success) {
              toastSuccess(verifyRes.data.message || '🎉 Payment verified! Plan successfully activated.');
              fetchSubscription();
            } else {
              throw new Error(verifyRes.data?.error || 'Payment signature verification failed.');
            }
          } catch (verifyErr) {
            toastError(verifyErr.response?.data?.error || verifyErr.message || 'Failed to verify payment with server');
          } finally {
            setActivatingId(null);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        toastError(resp.error?.description || 'Payment was unsuccessful or cancelled.');
        setActivatingId(null);
      });

      rzpInstance.open();
    } catch (err) {
      toastError(err.response?.data?.error || err.message || 'Unable to initiate payment');
      setActivatingId(null);
    }
  };

  // 3. RECHARGE BOOSTER PACK VIA RAZORPAY
  const handleRechargePack = async (pack) => {
    setRechargingId(pack.id || pack._id);
    try {
      const orderRes = await api.post('/admin/subscription/recharge/create-order', {
        packId: pack.id || pack._id,
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.error || 'Failed to create recharge order');
      }

      const { orderId, amount, currency, keyId, store } = orderRes.data;

      if (!window.Razorpay) {
        throw new Error('Razorpay payment gateway failed to load. Please refresh.');
      }

      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_HGCsLV5PjSYo8F',
        amount,
        currency: currency || 'INR',
        name: store?.name || 'BillFlow Store',
        description: `Booster: ${pack.title} (+${pack.credits} ${pack.type})`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        order_id: orderId,
        prefill: {
          name: store?.name || 'Store Admin',
          email: store?.email || '',
          contact: store?.phone || '',
        },
        theme: {
          color: pack.type === 'SMS' ? '#6366f1' : '#10b981',
        },
        modal: {
          ondismiss: () => {
            setRechargingId(null);
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/admin/subscription/recharge/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packId: pack.id || pack._id,
            });

            if (verifyRes.data?.success) {
              toastSuccess(verifyRes.data.message || `🎉 ${pack.credits} ${pack.type} credits added to your account!`);
              fetchSubscription();
            } else {
              throw new Error(verifyRes.data?.error || 'Recharge verification failed');
            }
          } catch (verifyErr) {
            toastError(verifyErr.response?.data?.error || verifyErr.message || 'Failed to verify recharge payment');
          } finally {
            setRechargingId(null);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        toastError(resp.error?.description || 'Recharge was cancelled or payment failed.');
        setRechargingId(null);
      });
      rzpInstance.open();
    } catch (err) {
      toastError(err.response?.data?.error || err.message || 'Unable to initiate booster recharge');
      setRechargingId(null);
    }
  };

  const current = data?.currentSubscription;
  const isTrial = current?.status === 'TRIAL' || current?.paymentStatus === 'FREE' || current?.planType === 'FREE_TRIAL';
  const daysRemaining = typeof data?.daysRemaining === 'number' ? data.daysRemaining : (current?.daysRemaining ?? null);
  const isExpired = current?.status === 'EXPIRED' || (daysRemaining !== null && daysRemaining <= 0);
  const hasActivePaidPlan = Boolean(current && current.status === 'ACTIVE' && !isTrial && !isExpired);
  // Merchants can ALWAYS renew, add days, or upgrade; existing days stack cleanly!
  const isRenewalAllowed = true;
  const renewalDaysLeft = daysRemaining && daysRemaining > 7 ? daysRemaining - 7 : 0;
  const plans = data?.availablePlans || [];
  const history = data?.history || [];
  const hasEverHadPlan = history.length > 0 || Boolean(current);

  const quotas = data?.quotas || {
    smsBalance: 0,
    smsPlanBalance: 0,
    smsBoosterBalance: 0,
    smsTotalCredited: 0,
    whatsAppBalance: 0,
    whatsAppPlanBalance: 0,
    whatsAppBoosterBalance: 0,
    whatsAppTotalCredited: 0,
    isSmsGloballyEnabled: true,
    isWhatsAppGloballyEnabled: true,
    smsDisabledNotice: '',
    whatsAppDisabledNotice: '',
  };
  const addOnPacks = data?.addOnPacks || [];
  const rechargeHistory = data?.rechargeHistory || [];

  const filteredBoosterPacks = addOnPacks.filter((p) => {
    if (boosterTab === 'ALL') return true;
    return p.type === boosterTab;
  });

  // Stacked days display e.g. "3+30 day left"
  const stackedDisplay = current?.stackedDisplay || (
    typeof daysRemaining === 'number'
      ? (daysRemaining > 30
          ? `${daysRemaining - 30}+30 day left`
          : `${daysRemaining} day left`)
      : 'Active'
  );

  return (
    <AppLayout
      title="Subscription Plans"
      subtitle="Store License & Upgrades"
      backTo="/profile"
    >
      <div className="max-w-6xl mx-auto space-y-4 pb-12">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
            Loading subscription details & plans...
          </div>
        ) : (
          <>
            {/* 1. CURRENT SUBSCRIPTION BANNER */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Current Plan
                    </h3>
                    <p className="text-sm font-black text-white">{current?.planName || 'No Active Plan'}</p>
                  </div>
                </div>

                {typeof daysRemaining === 'number' && (
                  <span
                    className={`text-xs font-black font-mono px-2.5 py-1 rounded-full border ${
                      daysRemaining > 7
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : daysRemaining > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {daysRemaining > 0 ? stackedDisplay : 'Expired'}
                  </span>
                )}
              </div>

              {/* Validity Details */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-medium">Valid From</span>
                  <span className="font-bold text-slate-200">
                    {current?.startDate ? new Date(current.startDate).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>

                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-medium">Valid Until</span>
                  <span className="font-bold text-slate-200">
                    {current?.endDate ? new Date(current.endDate).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>

                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                  <span
                    className={`font-black text-xs uppercase ${
                      current?.status === 'EXPIRED' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {current?.status || 'INACTIVE'}
                  </span>
                </div>
              </div>

              {/* Stacked Days Display: e.g. 3+30 day left */}
              <div className="mt-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                        Active Plan Remaining
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {current?.planName || 'Plan'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black font-mono text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 tracking-wide">
                    {stackedDisplay}
                  </span>
                </div>
              </div>
            </div>

            {/* 1.5. SMS & WHATSAPP LIVE QUOTA METERS */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Message & Receipt Quotas
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Credits deduct only upon successful customer receipt delivery</p>
                  </div>
                </div>
                <a
                  href="#booster-packs"
                  className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Top-up</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* SMS Balance Card */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">SMS Receipts</span>
                    </div>
                    {quotas.isSmsGloballyEnabled === false ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        ⚠️ Temp Band Hai
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-2xl font-black text-slate-950 font-mono">
                        {quotas.smsBalance}
                      </span>
                      <span className="text-xs font-bold text-slate-400 ml-1">Total Available</span>
                    </div>
                    {quotas.smsTotalCredited > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        of {quotas.smsTotalCredited} total
                      </span>
                    )}
                  </div>

                  {/* Quota Breakdown: Plan Quota vs Lifetime Booster */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div className="bg-white rounded-xl p-2 border border-slate-200 text-center shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">1st: Main Plan</span>
                      <span className="text-xs font-black text-slate-800 font-mono">{quotas.smsPlanBalance || 0}</span>
                      <span className="text-[8px] text-slate-400 block">plan expiry</span>
                    </div>
                    <div className="bg-indigo-50/70 rounded-xl p-2 border border-indigo-200 text-center shadow-2xs">
                      <span className="text-[9px] font-black text-indigo-600 block uppercase">2nd: Booster</span>
                      <span className="text-xs font-black text-indigo-950 font-mono">{quotas.smsBoosterBalance || 0}</span>
                      <span className="text-[8px] text-indigo-600 block font-bold">♾️ Never Expires</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight">
                    ⚡ Priority: Pehle plan quota use hoga. Booster balance plan renew hone par naye plan me add ho jayega.
                  </p>

                  {quotas.isSmsGloballyEnabled === false && quotas.smsDisabledNotice && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                      {quotas.smsDisabledNotice}
                    </p>
                  )}
                </div>

                {/* WhatsApp Balance Card */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">WhatsApp Receipts</span>
                    </div>
                    {quotas.isWhatsAppGloballyEnabled === false ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        ⚠️ Temp Band Hai
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-2xl font-black text-slate-950 font-mono">
                        {quotas.whatsAppBalance}
                      </span>
                      <span className="text-xs font-bold text-slate-400 ml-1">Total Available</span>
                    </div>
                    {quotas.whatsAppTotalCredited > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        of {quotas.whatsAppTotalCredited} total
                      </span>
                    )}
                  </div>

                  {/* Quota Breakdown: Plan Quota vs Lifetime Booster */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div className="bg-white rounded-xl p-2 border border-slate-200 text-center shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">1st: Main Plan</span>
                      <span className="text-xs font-black text-slate-800 font-mono">{quotas.whatsAppPlanBalance || 0}</span>
                      <span className="text-[8px] text-slate-400 block">plan expiry</span>
                    </div>
                    <div className="bg-emerald-50/70 rounded-xl p-2 border border-emerald-200 text-center shadow-2xs">
                      <span className="text-[9px] font-black text-emerald-700 block uppercase">2nd: Booster</span>
                      <span className="text-xs font-black text-emerald-950 font-mono">{quotas.whatsAppBoosterBalance || 0}</span>
                      <span className="text-[8px] text-emerald-700 block font-bold">♾️ Never Expires</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight">
                    ⚡ Priority: Pehle plan quota use hoga. Booster balance plan renew hone par naye plan me add ho jayega.
                  </p>

                  {quotas.isWhatsAppGloballyEnabled === false && quotas.whatsAppDisabledNotice && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                      {quotas.whatsAppDisabledNotice}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Renewal / Expiry Status Banners */}
            {isTrial && (
              <div className="p-4 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-950 rounded-3xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">
                    🎉 Free Trial Active ({daysRemaining} {daysRemaining === 1 ? 'Din Bacha Hai' : 'Din Bache Hain'}) • Buy Plan Open
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed font-medium">
                    Aap free trial ke dauran kabhi bhi kisi bhi Paid Plan ko buy kar sakte hain. Aapke bache hue {daysRemaining} trial din naye plan me pure ke pure add ho jayenge (Koi din waste nahi hoga)!
                  </p>
                </div>
              </div>
            )}

            {/* Expiry Warning Banner (Shown only when 7 or fewer days left) */}
            {hasActivePaidPlan && daysRemaining !== null && daysRemaining <= 7 && (
              <div className="p-4 bg-amber-500/15 border border-amber-500/30 text-amber-950 rounded-3xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    ⚡ Expiry Near ({daysRemaining} {daysRemaining === 1 ? 'Din Bacha Hai' : 'Din Bache Hain'})
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Aapka plan jald expire hone wala hai. Abhi renew karein taaki billing uninterrupted chale. Bache hue din naye plan ke saath add ho jayenge!
                  </p>
                </div>
              </div>
            )}

            {/* UPI AutoPay & Recurring Mandate Card (Google Pay / PhonePe / Paytm) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-2xl shrink-0 ${
                    autoPayInfo.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-600'
                      : autoPayInfo.status === 'CANCELLED' || autoPayInfo.status === 'PAYMENT_FAILED'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    <RefreshCw className={`w-5 h-5 ${togglingAutoPay ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        UPI AutoPay Mandate
                      </h3>
                      {autoPayInfo.status === 'ACTIVE' ? (
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active (Google Pay / PhonePe)</span>
                        </span>
                      ) : autoPayInfo.status === 'CANCELLED' ? (
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          ⚠️ Mandate Cancelled
                        </span>
                      ) : autoPayInfo.status === 'PAYMENT_FAILED' ? (
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          ⚠️ Payment Failed on Due Date
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          AutoPay Off
                        </span>
                      )}
                    </div>

                    {/* Supported Apps Chips */}
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Supported:</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Google Pay</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">PhonePe</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Paytm</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">BHIM UPI</span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                      {autoPayInfo.status === 'ACTIVE'
                        ? 'Aapka UPI AutoPay mandate active hai. Plan expiry ke din automatically renewal attempt hoga. Aap ise Google Pay / PhonePe se ya yahan se kabhi bhi cancel kar sakte hain.'
                        : autoPayInfo.status === 'CANCELLED'
                        ? 'AutoPay mandate cancel ho chuka hai. Plan expiry par koi auto-debit nahi hoga; billing continue rakhne ke liye manual renewal karein.'
                        : 'Plan expire hone par software automatically renew ho sake iske liye Google Pay ya PhonePe ke jariye UPI AutoPay mandate on karein.'}
                    </p>
                  </div>
                </div>

                {/* Mandate Action Button */}
                <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                  {autoPayInfo.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      disabled={togglingAutoPay}
                      onClick={handleCancelAutoPay}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <span>Cancel AutoPay</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={togglingAutoPay}
                      onClick={handleSetupAutoPay}
                      className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>{togglingAutoPay ? 'Connecting...' : autoPayInfo.status === 'CANCELLED' ? 'Re-enable AutoPay' : 'Set up UPI AutoPay'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Strict Payment Receipt Rules & Policy */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Strict Payment & Cancellation Protection Rules:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-500 pl-1 leading-normal">
                  <li><strong>Payment Receive Guarantee:</strong> AutoPay on hone ke baad bhi jab tak due date par actual payment hamare paas verify nahi hoti, tab tak plan renew nahi hoga.</li>
                  <li><strong>External Cancellation:</strong> Agar aap Google Pay ya bank app se mandate cancel karte hain, to mandate automatically band ho jayega aur bina payment ke koi extension nahi milega.</li>
                </ul>
              </div>
            </div>

            {isExpired && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-3xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950">
                    Subscription Expired
                  </h4>
                  <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                    Aapka subscription expire ho chuka hai. Naya bill banane ya catalog items add karne ke liye kripya niche diye gaye kisi bhi plan ko activate karein.
                  </p>
                </div>
              </div>
            )}

            {/* 2. AVAILABLE PLANS GRID */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Available Plans ({plans.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Secure UPI, QR, Google Pay, PhonePe, Cards & NetBanking via Razorpay
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Razorpay Verified</span>
                </div>
              </div>

              {plans.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-xs text-slate-400">
                  No subscription plans available currently. Please contact Super Admin.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {plans.map((p) => {
                    const isCurrent = current?.planId === (p.id || p._id);
                    const isActivating = activatingId === (p.id || p._id);
                    const isFree = p.price === 0 || p.planType === 'FREE_TRIAL';

                    return (
                      <div
                        key={p.id || p._id}
                        className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                          isCurrent
                            ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-sm text-slate-900">{p.name}</h4>
                                {isCurrent && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    Current
                                  </span>
                                )}
                                {p.isPopular && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {p.description || 'Full POS & Billing Access'}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xl font-black text-slate-950 block">
                                {isFree ? 'Free' : `₹${p.price}`}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {p.durationType}
                              </span>
                            </div>
                          </div>

                          {/* Features List */}
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Unlimited Invoices & Thermal Printing</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Instant UPI / QR / SMS Receipt Sharing</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Unlimited Products, Categories & Barcode Scanning</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Cashier Staff Logins (Multi-counter)</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Section with 7-Day Window Rule */}
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          {isFree ? (
                            hasEverHadPlan ? (
                              <div className="w-full py-3 bg-slate-100 text-slate-400 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 border border-slate-200/80">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Trial Already Used</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isActivating}
                                onClick={() => handleActivatePlan(p)}
                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-black rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <Zap className="w-4 h-4 fill-white" />
                                <span>Activate Free Trial</span>
                              </button>
                            )
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isActivating}
                                onClick={() => handleActivatePlan(p)}
                                className={`w-full py-3 text-white text-xs font-black rounded-2xl shadow-md active:scale-95 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer ${
                                  isCurrent
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20'
                                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-600/20'
                                }`}
                              >
                                {isActivating ? (
                                  <span>Processing with Razorpay...</span>
                                ) : (
                                  <>
                                    <Zap className="w-4 h-4 fill-white" />
                                    <span>
                                      {isCurrent
                                        ? `Renew / Add Days (₹${p.price})`
                                        : isTrial
                                        ? `Upgrade to Plan (₹${p.price})`
                                        : `Switch to Plan (₹${p.price})`}
                                    </span>
                                  </>
                                )}
                              </button>

                              <p className="text-[10px] text-center text-slate-400 font-medium flex items-center justify-center gap-1">
                                <CreditCard className="w-3 h-3 text-emerald-600" />
                                <span>{isCurrent ? '⚡ Days stacked: Remaining din waste nahi honge' : 'Instant Activation via UPI / Cards'}</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2.5. ADD-ON RECHARGE BOOSTER PACKS */}
            <div id="booster-packs" className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>SMS & WhatsApp Booster Packs</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Top-up extra message credits instantly via Razorpay UPI or Cards
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setBoosterTab('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      boosterTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    All ({addOnPacks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoosterTab('SMS')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      boosterTab === 'SMS' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoosterTab('WHATSAPP')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      boosterTab === 'WHATSAPP' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>

              {filteredBoosterPacks.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center border border-slate-200 text-xs text-slate-400">
                  No booster packs available right now. Contact Super Admin to create packs.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredBoosterPacks.map((pack) => {
                    const isRecharging = rechargingId === (pack.id || pack._id);
                    const isSMS = pack.type === 'SMS';
                    const isPackServicePaused = isSMS
                      ? quotas.isSmsGloballyEnabled === false
                      : quotas.isWhatsAppGloballyEnabled === false;

                    return (
                      <div
                        key={pack.id || pack._id}
                        className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 relative overflow-hidden"
                      >
                        {pack.isPopular && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-bl-xl">
                            Popular
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2.5 rounded-xl ${
                                isSMS ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              {isSMS ? <Smartphone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    isSMS ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {pack.type} Booster
                                </span>
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  ♾️ Never Expires
                                </span>
                              </div>
                              <h4 className="font-black text-sm text-slate-900 mt-0.5">{pack.title}</h4>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-2xl flex items-baseline justify-between">
                            <div>
                              <span className="text-xl font-black text-slate-950 font-mono">+{pack.credits}</span>
                              <span className="text-xs font-bold text-slate-500 ml-1">Credits</span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-black text-slate-950 font-mono">₹{pack.price}</span>
                            </div>
                          </div>

                          {pack.description && (
                            <p className="text-[11px] text-slate-500 leading-relaxed">{pack.description}</p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={isRecharging || isPackServicePaused}
                            onClick={() => handleRechargePack(pack)}
                            className={`w-full py-2.5 text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 ${
                              isPackServicePaused
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 opacity-70 cursor-not-allowed'
                                : isSMS
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-indigo-600/20 active:scale-95 cursor-pointer disabled:opacity-50'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>
                              {isPackServicePaused
                                ? '⚠️ Service Temp Band Hai'
                                : isRecharging
                                ? 'Opening Razorpay...'
                                : `Recharge Pack (₹${pack.price})`}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2.8. RECHARGE HISTORY */}
            {rechargeHistory.length > 0 && (
              <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-100">
                  Booster Pack Recharge History
                </h3>
                <div className="space-y-2 divide-y divide-slate-100">
                  {rechargeHistory.map((r) => (
                    <div key={r.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{r.packTitle}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">₹{r.amountPaid}</span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          +{r.creditsAdded} {r.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SUBSCRIPTION HISTORY */}
            {history.length > 0 && (
              <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-100">
                  License & Payment History
                </h3>
                <div className="space-y-2 divide-y divide-slate-100">
                  {history.map((h) => (
                    <div key={h.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{h.planName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.startDate).toLocaleDateString('en-IN')} -{' '}
                            {new Date(h.endDate).toLocaleDateString('en-IN')}
                          </span>
                          {h.transactionRef && (
                            <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded">
                              Ref: {h.transactionRef}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">
                          {h.amountPaid === 0 ? 'Free' : `₹${h.amountPaid}`}
                        </span>
                        <span className="text-[10px] text-emerald-700 uppercase font-bold">
                          {h.status} • {h.paymentMethod}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
