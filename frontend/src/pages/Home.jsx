import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield, FiCpu, FiTrendingUp, FiCheck, FiDollarSign } from 'react-icons/fi';

const Home = () => {
  // Energy Savings Calculator State (Indian Rupee context)
  const [bill, setBill] = useState(1500);
  const [sunHours, setSunHours] = useState(5);

  // INR electricity unit average rate ~8 Rs./kWh. Panel cost average ~50,000 Rs./kW
  const panelCapacityNeeded = ((bill / 8.0) / 30 / sunHours).toFixed(1);
  const estimatedCost = (panelCapacityNeeded * 50000).toLocaleString('en-IN');
  const monthlySavings = (bill * 0.80).toFixed(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Premium Hero Backdrop Image Section */}
      <div className="absolute top-0 left-0 right-0 h-[650px] overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-50 to-slate-50 dark:from-slate-950/20 dark:via-slate-950 dark:to-slate-950 z-10" />
        <div className="absolute inset-0 bg-brand/5 dark:bg-brand/10 mix-blend-overlay z-10" />
        <img 
          src="/solar_panels_bg.jpg" 
          alt="Solar Panels Field" 
          className="w-full h-full object-cover opacity-20 dark:opacity-30 blur-[1px] transform scale-105"
        />
      </div>

      {/* Background glow animations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand/10 rounded-full blur-[120px] pulse-glow pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-brand-lime/10 rounded-full blur-[100px] pulse-glow pointer-events-none" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 relative z-10">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 space-y-6 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1.5 text-sm font-semibold text-brand-dark dark:text-brand-lime">
            <span>✨</span> Next-Gen Smart Grid Ecosystem
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white sm:text-6xl leading-[1.1]">
            Empowering the <br />
            <span className="bg-gradient-to-r from-brand via-brand-emerald to-brand-lime bg-clip-text text-transparent">
              Clean Energy Trade
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto lg:mx-0">
            Solar Trade is an Apple-designed MERN system facilitating solar installations, clean energy crowdfunding, and peer-to-peer surplus grid trading.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <RouterLink
              to="/register"
              className="rounded-full bg-brand px-6 py-3.5 text-base font-semibold text-white hover:bg-brand-dark transition-all shadow-lg shadow-green-500/25 flex items-center gap-2"
            >
              Get Started Free <FiArrowRight />
            </RouterLink>
            <RouterLink
              to="/marketplace"
              className="rounded-full border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-6 py-3.5 text-base font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Explore Marketplace
            </RouterLink>
          </div>

          {/* Quick Hero Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto lg:mx-0">
            <div>
              <p className="text-2xl font-bold text-brand">14.2k Tons</p>
              <p className="text-xs text-slate-400 font-medium">CO2 Offset</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-emerald">1.8M kWh</p>
              <p className="text-xs text-slate-400 font-medium">Energy Traded</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-lime">₹54L+</p>
              <p className="text-xs text-slate-400 font-medium">ROI Distributed</p>
            </div>
          </div>
        </motion.div>

        {/* Hero Banner / Interactive Estimator Card */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 w-full max-w-lg"
        >
          <div className="glass-panel rounded-3xl p-6 shadow-premium relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-xl" />
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
              <span>🔋</span> Solar Savings Estimator
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Monthly Electricity Bill: <span className="text-brand font-bold">₹{bill}</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="100"
                  value={bill}
                  onChange={(e) => setBill(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Daily Sun Hours: <span className="text-brand font-bold">{sunHours} hours</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="8"
                  step="0.5"
                  value={sunHours}
                  onChange={(e) => setSunHours(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="text-center p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <p className="text-xs text-slate-400 font-medium">Panels Needed</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{panelCapacityNeeded} kW</p>
                </div>
                <div className="text-center p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <p className="text-xs text-slate-400 font-medium">Estimated Cost</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">₹{estimatedCost}</p>
                </div>
                <div className="text-center p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-brand/20">
                  <p className="text-xs text-brand font-medium">Monthly Save</p>
                  <p className="text-sm font-bold text-brand">₹{monthlySavings}</p>
                </div>
              </div>

              <RouterLink
                to="/install-solar"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand/10 hover:bg-brand/20 text-brand font-semibold py-3 text-sm transition-all"
              >
                Apply for Panels <FiArrowRight className="h-4 w-4" />
              </RouterLink>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-xs font-semibold tracking-wider text-brand uppercase mb-2">Our Features</h2>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white sm:text-4xl">
            Clean Energy Tools Built for You
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-3 gap-6"
        >
          {/* Card 1 */}
          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl shadow-glass hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-xl mb-4">
              <FiCpu />
            </div>
            <h3 className="text-lg font-bold mb-2">Smart Grid Subscriptions</h3>
            <p className="text-sm text-slate-400">
              Subscribe to regional green energy plans with dynamic pricing. Track consumption metrics in real-time.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl shadow-glass hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center text-xl mb-4">
              <FiShield />
            </div>
            <h3 className="text-lg font-bold mb-2">P2P Surplus Marketplace</h3>
            <p className="text-sm text-slate-400">
              Generate excess electricity with your panels? List and sell it directly to neighbors on the grid.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl shadow-glass hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-brand-lime/10 text-brand-lime flex items-center justify-center text-xl mb-4">
              <FiTrendingUp />
            </div>
            <h3 className="text-lg font-bold mb-2">Solar Farm Investments</h3>
            <p className="text-sm text-slate-400">
              Crowdfund operational projects in sunny areas. Accumulate real ROI and reduce planetary footprint.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing Module */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 relative z-10 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-xs font-semibold tracking-wider text-brand uppercase mb-2">Pricing</h2>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white sm:text-4xl">
            Flexible Energy Subscriptions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Plan 1 */}
          <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">Eco Basic</p>
              <p className="text-4xl font-extrabold my-4 text-slate-800 dark:text-white">
                ₹10.00 <span className="text-xs font-semibold text-slate-400">/ kWh</span>
              </p>
              <ul className="space-y-2 text-sm text-slate-500 mb-6">
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> 100% Green Backed</li>
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> Monthly invoice PDF</li>
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> Standard smart support</li>
              </ul>
            </div>
            <RouterLink to="/plans" className="w-full text-center rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-sm font-semibold transition-all">
              Choose Plan
            </RouterLink>
          </div>

          {/* Plan 2 - Featured */}
          <div className="glass-panel p-6 rounded-3xl shadow-premium border-2 border-brand relative flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
              Popular
            </span>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase mt-2">Solar Boost</p>
              <p className="text-4xl font-extrabold my-4 text-slate-800 dark:text-white">
                ₹8.00 <span className="text-xs font-semibold text-slate-400">/ kWh</span>
              </p>
              <ul className="space-y-2 text-sm text-slate-500 mb-6">
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> 100% Renewable field</li>
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> P2P trading access</li>
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> Realtime stats chart</li>
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> 150 points reward bonus</li>
              </ul>
            </div>
            <RouterLink to="/plans" className="w-full text-center rounded-2xl bg-brand text-white py-3 text-sm font-semibold hover:bg-brand-dark transition-all shadow-md shadow-green-500/20">
              Subscribe Now
            </RouterLink>
          </div>

          {/* Plan 3 */}
          <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">Ultra Green</p>
              <p className="text-4xl font-extrabold my-4 text-slate-800 dark:text-white">
                ₹6.00 <span className="text-xs font-semibold text-slate-400">/ kWh</span>
              </p>
              <ul className="space-y-2 text-sm text-slate-500 mb-6">
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> Solar panel installation rate</li>
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> Full smart grid controller</li>
                <li className="flex items-center gap-2"><FiCheck className="text-brand" /> Priority site inspections</li>
              </ul>
            </div>
            <RouterLink to="/plans" className="w-full text-center rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-sm font-semibold transition-all">
              View Plan
            </RouterLink>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 relative z-10 border-t border-slate-200/50 dark:border-slate-800/50">
        <h2 className="text-3xl font-extrabold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl">
            <h4 className="font-bold mb-2">How does the peer-to-peer energy trade work?</h4>
            <p className="text-sm text-slate-400">
              If your rooftop solar panels produce more energy than you consume, you can list the excess units (in kWh) on our marketplace. Other users on the grid can purchase those units, transferring simulated funds directly to your wallet.
            </p>
          </div>
          <div className="glass-panel p-5 rounded-2xl">
            <h4 className="font-bold mb-2">Is the payment gateway real?</h4>
            <p className="text-sm text-slate-400">
              No. The application implements our custom SolarPay gateway, which cryptographically signs checkout requests using HMAC algorithms and simulates card checkouts. No real credit card or money is used.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
