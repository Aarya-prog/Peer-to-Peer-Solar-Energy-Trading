import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiChevronDown, FiHelpCircle, FiZap, FiTool, FiDollarSign, FiShield } from 'react-icons/fi';

const FAQ = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState(null);

  const categories = ['All', 'General', 'Installations', 'Trading', 'Investments', 'SolarPay'];

  const faqs = [
    {
      category: 'General',
      icon: <FiHelpCircle className="text-blue-500" />,
      q: "What is Solar Trade?",
      a: "Solar Trade is a premium Web3-inspired, decentralized smart grid management platform. It empowers ordinary consumers to register, subscribe to eco-friendly grid plans, request rooftop solar installations, crowdfund commercial solar farms, and list and trade surplus solar energy directly with neighbors."
    },
    {
      category: 'General',
      icon: <FiHelpCircle className="text-blue-500" />,
      q: "How do roles work on the platform?",
      a: "During sign-up, you select a role that dictates your dashboard console: Customers manage bills, energy consumption, and purchase grid power. Investors fund solar farm projects and accrue interest. Engineers complete field inspection visits and write reports. Admins manage users, project catalog allocations, and overall system health."
    },
    {
      category: 'Installations',
      icon: <FiTool className="text-brand-emerald" />,
      q: "How does the rooftop solar panel setup request work?",
      a: "Customers submit an installation request with their location details and target panel capacity (3kW to 12kW). Admins review it and assign a verified field Engineer. The Engineer visits the site, updates the progress status tracker, writes a quotes quotation, deploys hardware, and uploads service completion reports."
    },
    {
      category: 'Installations',
      icon: <FiTool className="text-brand-emerald" />,
      q: "Are the engineering checklists simulated or real?",
      a: "The platform tracks a real-time multi-stage workflow simulation (Request -> Site Inspection -> Quote Generation -> Engineer Assignment -> Hardware Deploy -> Operational). Status transitions reflect instantly across both the Customer and Engineer dashboards."
    },
    {
      category: 'Trading',
      icon: <FiZap className="text-brand-lime" />,
      q: "How can I sell my surplus solar electricity?",
      a: "If you have an active rooftop solar installation, you can list excess electricity units (kWh) on the live marketplace order book. You define the quantity and select your unit pricing. Other active grid customers can then browse and purchase your listed power."
    },
    {
      category: 'Trading',
      icon: <FiZap className="text-brand-lime" />,
      q: "Does the platform charge fees for energy trading?",
      a: "Yes, Solar Trade deducts a minimal 5% commission from each successful peer-to-peer energy trade. These commission reports are automatically calculated and recorded inside the Admin metrics ledger logs for transparency."
    },
    {
      category: 'Investments',
      icon: <FiDollarSign className="text-brand" />,
      q: "What is Solar Field Crowdfunding?",
      a: "It allows investors to fund commercial solar farm projects (like desert arrays or commercial setups). When a project is in the 'Funding' stage, investors contribute capital. Once target funding is completed, the project transitions to 'Operational' and distributes regular ROI payouts."
    },
    {
      category: 'Investments',
      icon: <FiDollarSign className="text-brand" />,
      q: "How are dividends and valuation calculations simulated?",
      a: "Holdings valuation increases over time, and regular interest is simulated on your Investor dashboard portfolio. You can initiate a simulated payout transfer request to withdraw your accrued dividend profits directly back to your wallet."
    },
    {
      category: 'SolarPay',
      icon: <FiShield className="text-indigo-500" />,
      q: "What is the SolarPay Secure Gateway?",
      a: "SolarPay is our custom simulated checkout API. When completing checkouts (paying utility bills, investing in solar farms, or buying P2P energy), the server signs transaction details into a cryptographic HMAC SHA256 signature. The client checkout verifies this signature to prevent payload tampering."
    },
    {
      category: 'SolarPay',
      icon: <FiShield className="text-indigo-500" />,
      q: "How does cryptographic signature verification secure payments?",
      a: "Before a payout is executed, the backend re-calculates the HMAC signature using a secure, private environment key (`SOLARPAY_SECRET_KEY`) and matches it with the client payload signature. If they do not match, the transaction is rejected, preventing unauthorized price manipulations."
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(search.toLowerCase()) || 
                          faq.a.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10 px-4">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Help & Support Board</h2>
        <p className="text-sm text-slate-400">Search through our guides or filter categories to solve smart grid questions.</p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-lg mx-auto">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions or keywords..."
          className="w-full pl-12 pr-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand shadow-sm backdrop-blur-md"
        />
      </div>

      {/* Categories Tabs */}
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategory === cat
                ? 'bg-brand text-white shadow-md shadow-green-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion FAQ Board */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="glass-panel p-10 text-center text-slate-400 rounded-3xl">
            No matching questions found. Try searching for other terms.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl overflow-hidden shadow-glass border border-slate-100/50 dark:border-slate-850"
              >
                {/* Header click */}
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex justify-between items-center p-5 text-left font-bold text-slate-800 dark:text-white hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-all gap-4"
                >
                  <span className="flex items-center gap-3 text-sm">
                    {faq.icon}
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="text-slate-400" />
                  </motion.div>
                </button>

                {/* Answer Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100/20 dark:border-slate-850 text-xs text-slate-450 leading-relaxed dark:text-slate-400 pl-11">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FAQ;
