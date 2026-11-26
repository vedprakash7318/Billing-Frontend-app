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
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog, toastSuccess, toastError } from '../utils/alerts';

export default function SubscriptionPlans() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/subscription');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toastError(err.response?.data?.error || 'Failed to load subscription details');
    } finally {
      setLoading(false);
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

  const current = data?.currentSubscription;
  const daysRemaining = typeof data?.daysRemaining === 'number' ? data.daysRemaining : (current?.daysRemaining ?? null);
  const isExpired = current?.status === 'EXPIRED' || (daysRemaining !== null && daysRemaining <= 0);
  const hasActivePlan = Boolean(current && (current.status === 'ACTIVE' || current.status === 'TRIAL') && !isExpired);
  // Strict 7-day rule: Renewal allowed only if no active plan, expired, OR within 7 days of expiry
  const isRenewalAllowed = !hasActivePlan || (daysRemaining !== null && daysRemaining <= 7);
  const renewalDaysLeft = daysRemaining && daysRemaining > 7 ? daysRemaining - 7 : 0;
  const plans = data?.availablePlans || [];
  const history = data?.history || [];
  const hasEverHadPlan = history.length > 0 || Boolean(current);

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
                    className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                      daysRemaining > 7
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : daysRemaining > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
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

              {/* Plan Stacking / Renewal Notice */}
              <div className="mt-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-200 leading-relaxed">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-300 block">
                      Automatic Plan Stacking Enabled
                    </span>
                    <span>
                      Maan lo aapke paas <strong>3 din</strong> ka free trial ya plan bacha hai aur aap <strong>1 Month</strong> ka plan activate karte hain, to pure <strong>3 Din + 1 Month (33 Din)</strong> add honge. Koi bhi din waste nahi hoga!
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Renewal / Expiry Status Banners */}
            {hasActivePlan && !isRenewalAllowed && (
              <div className="p-4 bg-slate-900 text-white rounded-3xl flex items-start gap-3 border border-slate-800 shadow-md">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Subscription Active ({daysRemaining} Din Bache Hain)
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Aapka plan abhi fully active hai. Plan renewal aur switches expiry ke 7 din pehle (<strong>{renewalDaysLeft} din baad</strong>) activate honge. Tab tak plan buttons locked rahenge.
                  </p>
                </div>
              </div>
            )}

            {hasActivePlan && isRenewalAllowed && (
              <div className="p-4 bg-amber-500/15 border border-amber-500/30 text-amber-950 rounded-3xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    ⚡ Renewal Window Open ({daysRemaining} {daysRemaining === 1 ? 'Din Bacha Hai' : 'Din Bache Hain'})
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Aapka plan agle 7 dino me expire ho raha hai. Abhi renew karein taaki billing uninterrupted chale. Bache hue din naye plan ke saath add ho jayenge!
                  </p>
                </div>
              </div>
            )}

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
                <div className="space-y-4">
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
                          ) : !isRenewalAllowed ? (
                            isCurrent ? (
                              <div className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-2xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Currently Active ({daysRemaining} Days Left)</span>
                              </div>
                            ) : (
                              <div className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Renewal Unlocks in {renewalDaysLeft} Days</span>
                              </div>
                            )
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isActivating}
                                onClick={() => handleActivatePlan(p)}
                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-black rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {isActivating ? (
                                  <span>Processing with Razorpay...</span>
                                ) : (
                                  <>
                                    <Zap className="w-4 h-4 fill-white" />
                                    <span>
                                      {isCurrent
                                        ? `Renew via UPI / Razorpay (₹${p.price})`
                                        : `Pay & Activate (₹${p.price})`}
                                    </span>
                                  </>
                                )}
                              </button>

                              <p className="text-[10px] text-center text-slate-400 font-medium flex items-center justify-center gap-1">
                                <CreditCard className="w-3 h-3 text-emerald-600" />
                                <span>UPI (GPay/PhonePe/Paytm), Cards, NetBanking</span>
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
