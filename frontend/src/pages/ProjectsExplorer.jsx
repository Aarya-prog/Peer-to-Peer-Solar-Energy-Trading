import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiMapPin, FiAward, FiDollarSign } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const ProjectsExplorer = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Investment Modal States
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [amount, setAmount] = useState('');
  const [investing, setInvesting] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/investments/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openInvestModal = (proj) => {
    setActiveProject(proj);
    setInvestModalOpen(true);
  };

  const handleInvest = async (e) => {
    e.preventDefault();
    if (!activeProject) return;

    const investAmt = parseFloat(amount);
    if (isNaN(investAmt) || investAmt <= 0) {
      return toast.error('Please enter a valid investment amount');
    }

    setInvesting(true);
    try {
      // 1. Create Checkout Intent
      const intentRes = await api.post('/billing/payments/create-intent', {
        amount: investAmt,
        type: 'Investment',
        referenceId: activeProject._id,
      });

      if (!intentRes.data.success) throw new Error('Gateway initiation failed');

      const { checkoutId, signature } = intentRes.data.data;

      // 2. Crytographically Verify Signature and Complete Investment
      const investRes = await api.post('/investments/invest/' + activeProject._id, { amount: investAmt });
      const verifyRes = await api.post('/billing/payments/verify-signature', {
        checkoutId,
        signature,
        paymentMethod: 'Card',
      });

      if (investRes.data.success && verifyRes.data.success) {
        toast.success(`Successfully invested $${investAmt.toLocaleString()} in ${activeProject.name}!`);
        setInvestModalOpen(false);
        setAmount('');
        fetchProjects();
      }
    } catch (err) {
      toast.error(err.message || 'Investment failed');
    } finally {
      setInvesting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Solar Investment Projects</h2>
        <p className="text-sm text-slate-400 mt-1">Crowdfund grid-interactive solar projects and earn green dividends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const progressPercent = Math.min(100, Math.floor((proj.fundedAmount / proj.targetFunding) * 100));

          return (
            <div key={proj._id} className="glass-panel rounded-3xl overflow-hidden shadow-glass flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate max-w-[180px]">{proj.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      proj.status === 'Operational'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                        : proj.status === 'Construction'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3">{proj.description}</p>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <FiMapPin /> <span>{proj.location}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div>
                    <p className="text-slate-400 font-medium">Expected ROI</p>
                    <p className="font-bold text-brand flex items-center gap-0.5"><FiTrendingUp /> {proj.expectedROI}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Energy Capacity</p>
                    <p className="font-bold">{proj.energyGeneratedMwh ? `${proj.energyGeneratedMwh} MWh` : 'Under construction'}</p>
                  </div>
                </div>

                {/* Funding Progress Bar */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Funding Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>Raised: ₹{proj.fundedAmount.toLocaleString()}</span>
                    <span>Goal: ₹{proj.targetFunding.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                {proj.status === 'Funding' ? (
                  <button
                    onClick={() => openInvestModal(proj)}
                    className="w-full text-center rounded-2xl bg-brand text-white py-2.5 text-xs font-bold hover:bg-brand-dark transition-all shadow-md shadow-green-500/20"
                  >
                    Invest Now
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full text-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 py-2.5 text-xs font-bold cursor-not-allowed"
                  >
                    Funding Closed ({proj.status})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Crowdfund Invest Modal */}
      <Modal isOpen={investModalOpen} onClose={() => setInvestModalOpen(false)} title={`Invest in ${activeProject?.name}`}>
        {activeProject && (
          <form onSubmit={handleInvest} className="space-y-4">
            <div className="rounded-2xl bg-brand/5 border border-brand/20 p-4 text-center">
              <p className="text-xs text-slate-400 font-medium">EXPECTED RETURNS ANNUAL</p>
              <p className="text-3xl font-black text-brand">{activeProject.expectedROI}% ROI</p>
              <p className="text-[10px] text-slate-400 mt-1">Location: {activeProject.location}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">INVESTMENT VALUE (₹)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
              />
            </div>

            <button
              type="submit"
              disabled={investing}
              className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 mt-2"
            >
              {investing ? 'Processing Secure Checkout...' : 'Confirm Secure Investment'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ProjectsExplorer;
