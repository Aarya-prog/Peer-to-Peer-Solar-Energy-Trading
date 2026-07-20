import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiMessageSquare, FiSend, FiPlus } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Ticket States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  // Reply States
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/tickets');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/support/tickets', { subject, message, category });
      if (res.data.success) {
        toast.success('Support ticket created successfully!');
        setCreateModalOpen(false);
        setSubject('');
        setMessage('');
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const openReplyModal = (ticket) => {
    setActiveTicket(ticket);
    setReplyText('');
    setReplyModalOpen(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeTicket || !replyText) return;

    setReplying(true);
    try {
      const res = await api.post(`/support/tickets/${activeTicket._id}/reply`, {
        content: replyText,
      });

      if (res.data.success) {
        toast.success('Reply submitted!');
        setReplyModalOpen(false);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Support Tickets</h2>
          <p className="text-sm text-slate-400 mt-1">Submit tickets for solar setups, marketplace billing, or general inquiries.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark transition-all shadow-md shadow-green-500/25"
        >
          <FiPlus /> Open Ticket
        </button>
      </div>

      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Created Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                  No support tickets found. Click "Open Ticket" to request help.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <td className="px-6 py-4 font-semibold">{t.subject}</td>
                  <td className="px-6 py-4">{t.category}</td>
                  <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      t.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                      t.status === 'InProgress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openReplyModal(t)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <FiMessageSquare /> View Thread
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Ticket Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Open Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Inquiry Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Invoicing error in June"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Ticket Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
            >
              <option value="Billing">Billing</option>
              <option value="Installation">Installation</option>
              <option value="Marketplace">Marketplace</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Explain Details</label>
            <textarea
              required
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type issue details here..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg"
          >
            {submitting ? 'Submitting ticket...' : 'Confirm Submit'}
          </button>
        </form>
      </Modal>

      {/* Ticket Conversation Thread Modal (Simulated Chat UI) */}
      <Modal isOpen={replyModalOpen} onClose={() => setReplyModalOpen(false)} title="Ticket Conversation Thread">
        {activeTicket && (
          <div className="space-y-4">
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
              <p className="text-xs text-slate-400 font-bold">CLIENT DESCRIPTION:</p>
              <p className="text-sm font-semibold">{activeTicket.subject}</p>
              <p className="text-xs text-slate-500">{activeTicket.message}</p>
            </div>

            {/* Conversation list */}
            {activeTicket.replies && activeTicket.replies.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Replies History</p>
                {activeTicket.replies.map((reply, idx) => (
                  <div key={idx} className="text-xs p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40">
                    <p className="font-bold mb-1">{reply.sender === activeTicket.user ? 'You' : 'Support Team'}</p>
                    <p>{reply.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400 py-3">No replies yet. A support agent will respond shortly.</div>
            )}

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                required
                rows="3"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write reply notes here..."
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={replying}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-brand hover:bg-brand-dark py-3 text-xs font-semibold text-white transition-all"
              >
                <FiSend /> {replying ? 'Sending reply...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportTickets;
