import React from 'react';
import AppLayout from '../components/AppLayout';
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  FileQuestion,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Headphones,
} from 'lucide-react';

export default function HelpSupport() {
  const user = JSON.parse(localStorage.getItem('client_admin_user') || '{}');
  const storeName = user?.tenant?.businessName || user?.name || 'My Store';

  return (
    <AppLayout
      title="Help & Support"
      subtitle="Assistance & Documentation"
      backTo="/profile"
    >
      <div className="space-y-4 pb-12">
        {/* Banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">How can we help you?</h2>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                Support for {storeName} POS & Billing engine
              </p>
            </div>
          </div>
        </div>

        {/* Quick Contact Options */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-100">
            Contact Support
          </h3>

          <a
            href="https://wa.me/919876543210?text=Hello%20Support,%20I%20need%20help%20with%20my%20Billing%20POS"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">WhatsApp Live Chat</p>
                <p className="text-[11px] text-slate-500">Instant answers from our technical team</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-700" />
          </a>

          <a
            href="tel:+919876543210"
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Phone Support</p>
                <p className="text-[11px] text-slate-500">Mon - Sat (9:00 AM - 8:00 PM)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>

          <a
            href="mailto:support@billingpos.com"
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Email Support</p>
                <p className="text-[11px] text-slate-500">support@billingpos.com</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* FAQs Section */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-100">
            Frequently Asked Questions
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900">How do I print receipts on a thermal printer?</h4>
              <p className="text-slate-500 text-[11px] mt-1">
                When finalizing a bill, select "Print" as the receipt option. The browser will open the standard print dialog, pre-formatted for 80mm or 58mm thermal paper roll.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900">How does barcode scanning work?</h4>
              <p className="text-slate-500 text-[11px] mt-1">
                Tap the "Scan" camera button on the POS screen or Product form. Point your camera at standard packaging barcodes (Kurkure, Soap, Biscuits, etc.) and it auto-detects without custom stickers.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900">When can I renew my subscription plan?</h4>
              <p className="text-slate-500 text-[11px] mt-1">
                You can renew or switch your subscription plan within 7 days of expiry. Any remaining days on your current active plan are automatically added to your new plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
