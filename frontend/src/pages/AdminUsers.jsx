import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../components/Loader';
import { FiCheckCircle, FiXCircle, FiMapPin, FiCheck, FiX, FiShield } from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/dashboard/admin/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Action failed', { id: loader });
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ecosystem Verification & User Management</h2>
        <p className="text-sm text-slate-400 mt-1">Review active customers, investors, and system engineers. Verify Aadhaar/PAN government IDs.</p>
      </div>

      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
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
                      u.role === 'Engineer' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400' :
                      'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.governmentIdType && u.governmentIdType !== 'None' ? (
                      <div>
                        <div className="font-semibold flex items-center gap-1">
                          <FiShield className="text-brand-emerald h-3.5 w-3.5" /> {u.governmentIdType}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{u.governmentIdNumber}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not Submitted</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {u.verifiedLocation ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <FiMapPin className="text-slate-400" />
                        <span>{u.verifiedLocation}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No Location</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1 ${
                      u.verificationStatus === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400' :
                      u.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-450'
                    }`}>
                      {u.verificationStatus === 'Verified' ? <FiCheckCircle /> : u.verificationStatus === 'Rejected' ? <FiXCircle /> : null}
                      {u.verificationStatus || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== 'Admin' && (
                      <div className="flex items-center justify-end gap-2">
                        {u.verificationStatus !== 'Verified' && (
                          <button
                            onClick={() => handleVerify(u._id, 'Verified', u.verifiedLocation || u.address?.city)}
                            className="inline-flex items-center gap-1 rounded-full bg-brand/10 hover:bg-brand text-brand hover:text-white px-2.5 py-1 text-xs font-bold transition-all"
                            title="Verify User"
                          >
                            <FiCheck /> Verify
                          </button>
                        )}
                        {u.verificationStatus !== 'Rejected' && (
                          <button
                            onClick={() => handleVerify(u._id, 'Rejected', u.verifiedLocation)}
                            className="inline-flex items-center gap-1 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-2.5 py-1 text-xs font-bold transition-all"
                            title="Reject User"
                          >
                            <FiX /> Reject
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
