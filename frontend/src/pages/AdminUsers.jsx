import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../components/Loader';
import { FiCheckCircle, FiXCircle, FiMapPin, FiCheck, FiX, FiShield, FiFileText, FiDollarSign, FiUsers, FiEye, FiBriefcase } from 'react-icons/fi';
import Modal from '../components/Modal';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('General'); // 'General', 'KYC', 'Withdrawals', 'Investments'
  
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchAllData = async () => {
    try {
      const usersRes = await api.get('/dashboard/admin/users');
      if (usersRes.data.success) setUsers(usersRes.data.data);
    } catch (err) {
      console.error('Failed to load users verification metrics', err);
    }

    try {
      const kycRes = await api.get('/kyc/admin/all');
      if (kycRes.data.success) setKycRequests(kycRes.data.data);
    } catch (err) {
      console.error('Failed to load KYC applications', err);
    }

    try {
      const withdrawRes = await api.get('/investments/admin/withdrawals');
      if (withdrawRes.data.success) setWithdrawals(withdrawRes.data.data);
    } catch (err) {
      console.error('Failed to load withdrawal requests', err);
    }

    try {
      const investRes = await api.get('/investments/all');
      if (investRes.data.success) setInvestments(investRes.data.data);
    } catch (err) {
      console.error('Failed to load platform investments', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleVerify = async (userId, status, currentLoc) => {
    const loc = currentLoc || 'Punjab';
    const loader = toast.loading(`Setting status to ${status}...`);
    try {
      const res = await api.put(`/dashboard/admin/users/${userId}/verify`, {
        status,
        verifiedLocation: loc,
      });
      if (res.data.success) {
        toast.success(`User verification set to ${status}!`, { id: loader });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.message || 'Action failed', { id: loader });
    }
  };

  const handleKycStatusChange = async (kycId, status) => {
    let reason = '';
    if (status === 'Rejected') {
      reason = window.prompt('Please enter a rejection reason:') || 'Documents mismatch';
      if (!reason.trim()) return;
    }
    const loader = toast.loading(`Updating KYC to ${status}...`);
    try {
      const res = await api.put(`/kyc/admin/${kycId}/status`, { status, rejectionReason: reason });
      if (res.data.success) {
        toast.success(`KYC set to ${status}!`, { id: loader });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.message || 'KYC status update failed', { id: loader });
    }
  };

  const handleApproveWithdrawal = async (requestId, status) => {
    const loader = toast.loading(`Processing payout withdrawal request...`);
    try {
      const res = await api.put(`/investments/admin/withdrawals/${requestId}/approve`, { status });
      if (res.data.success) {
        toast.success(`Withdrawal request successfully ${status === 'Approved' ? 'Approved' : 'Rejected'}!`, { id: loader });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.message || 'Action failed', { id: loader });
    }
  };

  if (loading) return <Spinner />;

  // Category counts
  const pendingKycCount = kycRequests.filter(k => k.status === 'Pending').length;
  const pendingWithdrawalCount = withdrawals.length;

  return (
    <div className="space-y-6">
      {/* Top Banner and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ecosystem Verification & User Management</h2>
          <p className="text-sm text-slate-400 mt-1">Review user accounts, approve KYC identity claims, and dispatch matured withdrawals.</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60 w-fit relative z-10">
        <button
          onClick={() => setActiveTab('General')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'General' ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FiUsers /> General Verifications
        </button>
        <button
          onClick={() => setActiveTab('KYC')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'KYC' ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FiFileText /> KYC Review
          {pendingKycCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[9px] w-5 h-5 flex items-center justify-center font-bold">
              {pendingKycCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('Withdrawals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'Withdrawals' ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FiDollarSign /> Pending Withdrawals
          {pendingWithdrawalCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[9px] w-5 h-5 flex items-center justify-center font-bold">
              {pendingWithdrawalCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('Investments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'Investments' ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FiBriefcase /> Platform Investments
        </button>
      </div>

      {/* General Verifications Tab */}
      {activeTab === 'General' && (
        <div className="glass-panel rounded-3xl shadow-glass overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Name / Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Government ID Details</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-white">{u.name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        u.role === 'Admin' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                        u.role === 'Investor' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400' :
                        'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.governmentIdType && u.governmentIdType !== 'None' ? (
                        <div>
                          <div className="font-bold text-slate-700 dark:text-slate-300">{u.governmentIdType}</div>
                          <div className="text-xs text-slate-400 font-mono">{u.governmentIdNumber}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No government ID uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {u.verifiedLocation ? (
                        <span className="flex items-center gap-1"><FiMapPin /> {u.verifiedLocation}</span>
                      ) : (
                        <span className="italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        u.verificationStatus === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400' :
                        u.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                      }`}>
                        {u.verificationStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.verificationStatus !== 'Verified' ? (
                        <button
                          onClick={() => handleVerify(u.user?._id || u._id, 'Verified', u.address?.state || 'Punjab')}
                          className="bg-brand text-white hover:bg-brand-dark px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm shadow-green-500/10"
                        >
                          Verify User
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(u.user?._id || u._id, 'Rejected', 'Punjab')}
                          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        >
                          Revoke Verification
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Investor KYC Review Tab */}
      {activeTab === 'KYC' && (
        <div className="glass-panel rounded-3xl shadow-glass overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Investor Detail</th>
                  <th className="px-6 py-4">Aadhaar/PAN</th>
                  <th className="px-6 py-4">Bank Account Details</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">KYC Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {kycRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      No investor KYC applications submitted.
                    </td>
                  </tr>
                ) : (
                  kycRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-white">{req.fullName}</div>
                        <div className="text-xs text-slate-400">{req.user?.email || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">DOB: {new Date(req.dob).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <div className="font-bold text-slate-700 dark:text-slate-300">PAN: {req.panNumber}</div>
                        <div>Aadhaar: {req.aadhaarNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-white">{req.bankName}</div>
                        <div className="text-slate-400">{req.accountNumber} ({req.accountHolderName})</div>
                        <div className="text-[10px] text-brand">IFSC: {req.ifscCode}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={req.address}>
                        {req.address}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          req.status === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400' :
                          req.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedKyc(req); setViewModalOpen(true); }}
                          className="flex items-center gap-1 bg-brand/15 text-brand hover:bg-brand hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
                          title="Review Application Details"
                        >
                          <FiEye /> Review Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Withdrawals Tab */}
      {activeTab === 'Withdrawals' && (
        <div className="glass-panel rounded-3xl shadow-glass overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Investor Email</th>
                  <th className="px-6 py-4">Solar Project Source</th>
                  <th className="px-6 py-4">Total principal lock</th>
                  <th className="px-6 py-4">Payout Amount (with Profit)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      No pending lock-in withdrawal payout requests.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                        <div>{w.user?.name}</div>
                        <div className="text-xs text-slate-400">{w.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-500">
                        {w.investment?.project?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        ₹{w.investment?.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-brand">
                        ₹{w.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400 px-2 py-0.5 text-xs font-bold">
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveWithdrawal(w._id, 'Approved')}
                          className="bg-brand text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-brand-dark transition-all flex items-center gap-1"
                        >
                          <FiCheck /> Approve payout
                        </button>
                        <button
                          onClick={() => handleApproveWithdrawal(w._id, 'Rejected')}
                          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <FiX /> Deny
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Platform Investments Tab */}
      {activeTab === 'Investments' && (
        <div className="glass-panel rounded-3xl shadow-glass overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Investor Detail</th>
                  <th className="px-6 py-4">Solar Project Funded</th>
                  <th className="px-6 py-4">Principal Amount</th>
                  <th className="px-6 py-4">expected Yield (ROI)</th>
                  <th className="px-6 py-4">Maturity Date</th>
                  <th className="px-6 py-4 text-right">Lock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      No active platform investments found.
                    </td>
                  </tr>
                ) : (
                  investments.map((inv) => {
                    const daysLeft = Math.max(0, Math.ceil((new Date(inv.maturityDate) - new Date()) / (1000 * 60 * 60 * 24)));
                    return (
                      <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 dark:text-white">{inv.user?.name || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{inv.user?.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          {inv.project?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-brand">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {inv.roi}% ROI ({inv.durationMonths} Months)
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(inv.maturityDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold inline-block ${
                              inv.status === 'Locked'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                                : inv.status === 'Matured'
                                ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-500'
                            }`}
                          >
                            {inv.status} {inv.status === 'Locked' && `(${daysLeft} Days remaining)`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed KYC Verification Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Investor KYC Application Review"
      >
        {selectedKyc && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400">FULL NAME</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedKyc.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">DATE OF BIRTH</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {new Date(selectedKyc.dob).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-850 pt-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400">PAN CARD NUMBER</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white font-mono uppercase">{selectedKyc.panNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">AADHAAR NUMBER</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white font-mono">{selectedKyc.aadhaarNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">GST NUMBER</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white uppercase">{selectedKyc.gstNumber || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
              <p className="text-[10px] font-bold text-slate-400">RESIDENTIAL ADDRESS</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedKyc.address}</p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Payout Bank Account Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">BANK NAME</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedKyc.bankName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">ACCOUNT HOLDER NAME</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedKyc.accountHolderName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400">ACCOUNT NUMBER</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white font-mono">{selectedKyc.accountNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">IFSC CODE</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white font-mono uppercase">{selectedKyc.ifscCode}</p>
                </div>
              </div>

              {selectedKyc.upiId && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-slate-400">UPI ID</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedKyc.upiId}</p>
                </div>
              )}
            </div>

            {/* Document Images Display */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Uploaded Document Previews</h4>
              
              <div className="grid grid-cols-1 gap-4">
                {selectedKyc.profilePhoto && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400">PROFILE PHOTO</p>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48 flex justify-center bg-slate-900/5">
                      <img
                        src={selectedKyc.profilePhoto}
                        alt="Profile Photo"
                        className="max-h-48 object-contain"
                      />
                    </div>
                  </div>
                )}

                {selectedKyc.identityProof && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400">IDENTITY PROOF (PAN/Aadhaar)</p>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-64 flex justify-center bg-slate-900/5">
                      <img
                        src={selectedKyc.identityProof}
                        alt="Identity Proof"
                        className="max-h-64 object-contain"
                      />
                    </div>
                  </div>
                )}

                {selectedKyc.addressProof && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400">ADDRESS PROOF (Utility Bill/Passport)</p>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-64 flex justify-center bg-slate-900/5">
                      <img
                        src={selectedKyc.addressProof}
                        alt="Address Proof"
                        className="max-h-64 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons inside modal */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex gap-3">
              {selectedKyc.status === 'Pending' ? (
                <>
                  <button
                    onClick={async () => {
                      setViewModalOpen(false);
                      await handleKycStatusChange(selectedKyc._id, 'Verified');
                    }}
                    className="flex-1 rounded-2xl bg-brand hover:bg-brand-dark py-2.5 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <FiCheck /> Approve KYC
                  </button>
                  <button
                    onClick={async () => {
                      setViewModalOpen(false);
                      await handleKycStatusChange(selectedKyc._id, 'Rejected');
                    }}
                    className="flex-1 rounded-2xl bg-red-500 hover:bg-red-650 py-2.5 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <FiX /> Reject KYC
                  </button>
                </>
              ) : selectedKyc.status === 'Verified' ? (
                <button
                  onClick={async () => {
                    setViewModalOpen(false);
                    await handleKycStatusChange(selectedKyc._id, 'Rejected');
                  }}
                  className="w-full rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  Revoke Verification
                </button>
              ) : (
                <div className="w-full text-center text-xs text-slate-400 italic py-2">
                  Status: {selectedKyc.status} (No actions available)
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
