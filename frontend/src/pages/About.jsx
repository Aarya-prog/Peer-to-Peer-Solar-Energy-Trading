import React from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiShield, FiTrendingUp, FiTool, FiGlobe, FiUsers } from 'react-icons/fi';

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  const pillars = [
    {
      icon: <FiZap className="text-brand-lime" />,
      title: "P2P Energy Trading",
      description: "Direct energy trading between neighbors, bypassing traditional middlemen. Sellers earn fair value for surplus power, while buyers access clean energy at lower local rates."
    },
    {
      icon: <FiTrendingUp className="text-brand" />,
      title: "Solar Fields Crowdfunding",
      description: "Democratizing energy investments. Anyone can fund commercial-grade solar arrays globally and earn competitive ROI dividends from live green power generation."
    },
    {
      icon: <FiTool className="text-brand-emerald" />,
      title: "Field Deployment Pipeline",
      description: "Direct coordination with verified solar installers. Our structured workflow takes customers from inspection, instant quoting, and engineer deployment to active power generation."
    },
    {
      icon: <FiShield className="text-blue-500" />,
      title: "SolarPay Cryptography",
      description: "Secure, tamper-proof payment processing using server-verified HMAC-SHA256 signatures. Every rupee processed is secure, cryptographically backed, and transparent."
    }
  ];

  const milestones = [
    { label: "CO2 Offset", value: "14.2k Tons" },
    { label: "Energy Traded", value: "1.8M kWh" },
    { label: "Active Solar Projects", value: "20+" },
    { label: "Community Members", value: "10,000+" }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-16 py-12 px-4 sm:px-6"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand-dark dark:text-brand-lime">
          <span>🌱</span> Our Vision for a Greener Tomorrow
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white sm:text-5xl leading-tight">
          Democratizing Clean Energy with{" "}
          <span className="bg-gradient-to-r from-brand via-brand-emerald to-brand-lime bg-clip-text text-transparent">
            Solar Trade
          </span>
        </h1>
        <p className="text-base text-slate-500 leading-relaxed dark:text-slate-400">
          Solar Trade is a modern, enterprise-level smart grid management system designed to make clean energy access open, secure, and simple. We connect homeowners, engineers, and investors to build a decentralized, carbon-neutral grid.
        </p>
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {milestones.map((ms, index) => (
          <div key={index} className="glass-panel p-6 rounded-3xl text-center shadow-glass hover:shadow-premium transition-all duration-300">
            <p className="text-3xl font-black text-brand mb-1">{ms.value}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ms.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Mission & Purpose Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Our Environmental Mission</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            By 2030, our goal is to help facilitate the transition of over 50,000 households to complete smart-grid solar reliance. 
            Through peer-to-peer distribution, we eliminate transmission inefficiencies and keep green energy rates localized and fair.
          </p>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 rounded-2xl bg-brand/10 text-brand text-lg">
                <FiGlobe />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Global Accessibility</h4>
                <p className="text-xs text-slate-400">Allows micro-investments into community solar fields across Sunny zones globally.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 rounded-2xl bg-brand-emerald/10 text-brand-emerald text-lg">
                <FiUsers />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Community Centric</h4>
                <p className="text-xs text-slate-400">Redistributes grid revenue back to green home developers and engineering operators.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-brand/5 border border-brand/15 rounded-3xl space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">Strategic Operations</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Every clean energy project hosted on Solar Trade undergoes severe hardware evaluations by our engineering crew, certifying that target yields are met. Contracts are encoded directly to ensure transparency between the solar farm managers and active crowd-investors.
          </p>
          <blockquote className="border-l-4 border-brand pl-4 italic text-xs text-slate-400 dark:text-slate-500">
            "Decentralized power is the only sustainable mechanism to power future computing requirements and smart grids globally without carbon overheads."
          </blockquote>
        </div>
      </motion.div>

      {/* Core Pillars */}
      <motion.div variants={itemVariants} className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Our Core Pillars</h2>
          <p className="text-xs text-slate-400">What makes the Solar Trade smart ecosystem unique and premium.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((p, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-3xl shadow-glass flex gap-4 items-start hover:-translate-y-1 transition-all duration-300">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-2xl flex items-center justify-center">
                {p.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">{p.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default About;
