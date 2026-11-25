import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, ArrowRight, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { toastSuccess } from '../utils/alerts';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/admin/login', { email, password });
      if (res.data?.success) {
        localStorage.setItem('client_admin_token', res.data.token);
        localStorage.setItem('client_admin_user', JSON.stringify(res.data.user));
        toastSuccess(`Welcome back, ${res.data.user.name || 'Store Admin'}!`);
        navigate('/');
      } else {
        throw new Error(res.data?.error || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 relative overflow-hidden shadow-2xl">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="pt-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Store Admin App
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            BillFlow Merchant Mobile & Web Console
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative z-10 space-y-5 my-auto">
          <div>
            <h2 className="text-base font-bold text-white">Merchant Login</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter the credentials provided by your billing administrator
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Client Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@mystore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating Store...' : 'Log In to My Store'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center pb-4 text-[11px] text-slate-500 relative z-10">
          <p>Powered by BillFlow SaaS Billing Platform</p>
        </div>
      </div>
    </div>
  );
}
