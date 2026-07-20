import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiBriefcase, FiTrash2 } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetFunding, setTargetFunding] = useState('');
  const [location, setLocation] = useState('');
  const [expectedROI, setExpectedROI] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/investments/projects', {
        name,
        description,
        targetFunding: parseFloat(targetFunding),
        location,
        expectedROI: parseFloat(expectedROI),
      });

      if (res.data.success) {
        toast.success('Project created successfully!');
        setModalOpen(false);
        // Clear
        setName('');
        setDescription('');
        setTargetFunding('');
        setLocation('');
        setExpectedROI('');
        fetchProjects();
      }
    } catch (err) {
      toast.error(err.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Solar Fields Crowdfund</h2>
          <p className="text-sm text-slate-400 mt-1">Configure active, construction, or operational projects.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark transition-all shadow-md shadow-green-500/25"
        >
          <FiPlus /> New Solar Farm
        </button>
      </div>

      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-4">Project Name</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Funding Target</th>
              <th className="px-6 py-4">ROI %</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {projects.map((p) => (
              <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                <td className="px-6 py-4 font-semibold">{p.name}</td>
                <td className="px-6 py-4">{p.location}</td>
                <td className="px-6 py-4 font-bold">₹{p.targetFunding.toLocaleString()}</td>
                <td className="px-6 py-4 text-brand font-bold">{p.expectedROI}%</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-green-50/80 border border-green-200 px-2 py-0.5 text-xs font-bold text-brand-emerald">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Project Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Solar Field Project">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nevada desert array"
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Description</label>
            <textarea
              required
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Solar cells, grids details..."
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Target Capital ($)</label>
              <input
                type="number"
                required
                value={targetFunding}
                onChange={(e) => setTargetFunding(e.target.value)}
                placeholder="100000"
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Annual ROI (%)</label>
              <input
                type="number"
                required
                step="0.1"
                value={expectedROI}
                onChange={(e) => setExpectedROI(e.target.value)}
                placeholder="10.5"
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Location</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Phoenix, AZ"
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 mt-2"
          >
            {submitting ? 'Creating field...' : 'Confirm Deploy'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProjects;
