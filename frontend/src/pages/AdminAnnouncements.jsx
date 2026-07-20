import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiVolume2 } from 'react-icons/fi';

const AdminAnnouncements = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/notifications/announcement', { title, content });
      if (res.data.success) {
        toast.success('Announcement broadcast successfully!');
        setTitle('');
        setContent('');
      }
    } catch (err) {
      toast.error(err.message || 'Broadcast failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Broadcast</h2>
        <p className="text-sm text-slate-400 mt-1">Publish global announcements to all system users and grid participants.</p>
      </div>

      <div className="glass-panel p-6 rounded-3xl shadow-glass">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Announcement Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart grid scheduling and upgrades"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Message Content</label>
            <textarea
              required
              rows="6"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type message content here..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg"
          >
            <FiVolume2 /> {loading ? 'Broadcasting...' : 'Broadcast Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
