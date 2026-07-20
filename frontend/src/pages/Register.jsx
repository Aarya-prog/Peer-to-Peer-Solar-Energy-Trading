import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiGift, FiArrowRight } from 'react-icons/fi';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Customer');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await register(name, email, password, role, referralCode);
    setLoading(false);
    if (success) {
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative rounded-3xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/solar_panels_bg.jpg" 
          alt="Background" 
          className="w-full h-full object-cover opacity-15 dark:opacity-25 blur-[1px] transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/90 via-slate-50/40 to-brand/10 dark:from-slate-950/90 dark:via-slate-950/40 dark:to-brand/10 z-10" />
      </div>

      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-emerald/5 rounded-full blur-[100px] pointer-events-none" />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-premium relative z-10 border border-white/20 dark:border-slate-800/50"
      >
        <div className="text-center mb-6">
          <span className="text-4xl">☀️</span>
          <h2 className="text-2xl font-bold mt-3 bg-gradient-to-r from-brand to-brand-emerald bg-clip-text text-transparent">
            Join Solar Trade
          </h2>
          <p className="text-xs text-slate-400 mt-1">Start your clean energy journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Full Name</label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:border-brand transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:border-brand transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:border-brand transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">User Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:border-brand transition-all text-sm"
              >
                <option value="Customer">Customer</option>
                <option value="Investor">Investor</option>
                <option value="Engineer">Engineer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Referral Code (Opt)</label>
              <div className="relative">
                <FiGift className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="REF123"
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:border-brand transition-all text-sm uppercase"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-dark py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Sign Up'} <FiArrowRight />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
