import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiTool, FiUserPlus } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const AdminInstallations = () => {
  const [installations, setInstallations] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [activeInstall, setActiveInstall] = useState(null);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const instRes = await api.get('/installations/all');
      const engRes = await api.get('/dashboard/admin/engineers');

      if (instRes.data.success) setInstallations(instRes.data.data);
      if (engRes.data.success) setEngineers(engRes.data.data);
    } catch (err) {
      toast.error('Failed to load installations metadata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (install) => {
    setActiveInstall(install);
    setSelectedEngineer(install.engineer?._id || '');
    setModalOpen(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!activeInstall || !selectedEngineer) return;

    setAssigning(true);
    try {
      const res = await api.put(`/installations/${activeInstall._id}/status`, {
        status: 'Engineer Assignment',
        engineerId: selectedEngineer,
      });

      if (res.data.success) {
        toast.success('Engineer assigned successfully!');
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Solar Installation Tracker</h2>
        <p className="text-sm text-slate-400 mt-1">Review residential/commercial panel installations and engineer visits.</p>
      </div>

      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Assigned Engineer</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {installations.map((inst) => (
              <tr key={inst._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                <td className="px-6 py-4 font-semibold">{inst.user?.name || 'Unknown User'}</td>
                <td className="px-6 py-4">{inst.panelCapacityKw} kW</td>
                <td className="px-6 py-4 truncate max-w-[180px]">
                  {inst.address.street}, {inst.address.city}
                </td>
                <td className="px-6 py-4">{inst.engineer?.name || <span className="text-slate-400">Not assigned</span>}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-brand/5 border border-brand/20 px-2.5 py-0.5 text-xs font-bold text-brand-dark dark:text-brand-lime">
                    {inst.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openAssignModal(inst)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <FiUserPlus /> Assign Engineer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Engineer Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Assign Site Engineer">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Select Field Engineer</label>
            <select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            >
              <option value="">-- Choose Engineer --</option>
              {engineers.map((eng) => (
                <option key={eng._id} value={eng._id}>
                  {eng.name} ({eng.email})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={assigning}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 mt-2"
          >
            {assigning ? 'Assigning...' : 'Assign Engineer & Start Workflow'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminInstallations;
