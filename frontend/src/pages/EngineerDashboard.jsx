import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiTool, FiCheckCircle, FiEdit2, FiPlusCircle } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const EngineerDashboard = () => {
  const [installations, setInstallations] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Modal States
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeInstall, setActiveInstall] = useState(null);
  const [status, setStatus] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [updating, setUpdating] = useState(false);

  // Report Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportPhoto, setReportPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchEngineerData = async () => {
    try {
      const instRes = await api.get('/installations/engineer');
      const maintRes = await api.get('/maintenance/all'); // filter for engineer inside frontend or let admin query assigned ones

      if (instRes.data.success) setInstallations(instRes.data.data);
      if (maintRes.data.success) {
        // filter maintenance requests assigned to this engineer
        setMaintenances(maintRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load engineer orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngineerData();
  }, []);

  const openStatusModal = (install) => {
    setActiveInstall(install);
    setStatus(install.status);
    setQuoteAmount(install.quoteAmount || '');
    setStatusModalOpen(true);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!activeInstall) return;

    setUpdating(true);
    try {
      const res = await api.put(`/installations/${activeInstall._id}/status`, {
        status,
        quoteAmount: quoteAmount ? parseFloat(quoteAmount) : undefined,
      });

      if (res.data.success) {
        toast.success('Installation status updated!');
        setStatusModalOpen(false);
        fetchEngineerData();
      }
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  const openReportModal = (install) => {
    setActiveInstall(install);
    setReportText(install.serviceReport || '');
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!activeInstall) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('serviceReport', reportText);
      if (reportPhoto) {
        formData.append('photo', reportPhoto);
      }

      const res = await api.put(`/installations/${activeInstall._id}/report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Service report submitted successfully!');
        setReportModalOpen(false);
        setReportPhoto(null);
        fetchEngineerData();
      }
    } catch (err) {
      toast.error(err.message || 'Report upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      {/* Overview header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Engineer Console</h2>
        <p className="text-sm text-slate-400 mt-1">Manage assigned rooftop panel installations and service checkups.</p>
      </div>

      {/* Installations Table */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiTool /> Assigned Solar Installations
          </h3>
          <span className="text-xs font-semibold text-slate-400">{installations.length} Active Orders</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/20 dark:bg-slate-900/20">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4">Address</th>
              <th className="px-6 py-4">Workflow Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {installations.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                  No assigned solar installation work orders.
                </td>
              </tr>
            ) : (
              installations.map((inst) => (
                <tr key={inst._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <td className="px-6 py-4 font-semibold">{inst.user.name}</td>
                  <td className="px-6 py-4">{inst.panelCapacityKw} kW</td>
                  <td className="px-6 py-4 truncate max-w-[180px]">
                    {inst.address.street}, {inst.address.city}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-brand/5 border border-brand/20 px-2.5 py-0.5 text-xs font-bold text-brand-dark dark:text-brand-lime">
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openStatusModal(inst)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <FiEdit2 /> Update Status
                    </button>
                    <button
                      onClick={() => openReportModal(inst)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand px-3 py-1.5 text-xs font-semibold hover:bg-brand/25 transition-all"
                    >
                      <FiPlusCircle /> Submit Report
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Maintenance Table */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiTool /> Maintenance Tickets
          </h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/20 dark:bg-slate-900/20">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Visit Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {maintenances.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                  No assigned active maintenance tickets.
                </td>
              </tr>
            ) : (
              maintenances.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <td className="px-6 py-4 font-semibold">{m.customer.name}</td>
                  <td className="px-6 py-4 truncate max-w-[200px]">{m.description}</td>
                  <td className="px-6 py-4">{m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : 'Pending schedule'}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400 px-2 py-0.5 text-xs font-bold">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Installation Status Modal */}
      <Modal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="Update Order Workflow">
        {activeInstall && (
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Select Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
              >
                <option value="Request">Request</option>
                <option value="Site Inspection">Site Inspection</option>
                <option value="Quotation">Quotation</option>
                <option value="Engineer Assignment">Engineer Assignment</option>
                <option value="Installation">Installation</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {status === 'Quotation' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Quote Cost ($)</label>
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="e.g. 12000"
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/20"
            >
              {updating ? 'Updating status...' : 'Save Status'}
            </button>
          </form>
        )}
      </Modal>

      {/* Upload Service Report & Image Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Submit Engineering Report">
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Service Report Notes</label>
            <textarea
              required
              rows="4"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Provide site report details, panels layout descriptions, and installation validation checkpoints..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Upload Inspection / Install Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setReportPhoto(e.target.files[0])}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/20"
          >
            {uploading ? 'Submitting report...' : 'Submit Report Details'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default EngineerDashboard;
