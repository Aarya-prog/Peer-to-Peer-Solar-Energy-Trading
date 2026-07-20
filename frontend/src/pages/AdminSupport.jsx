import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiMessageSquare, FiSend } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reply States
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

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

  const openReplyModal = (ticket) => {
    setActiveTicket(ticket);
    setReplyText('');
    setModalOpen(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeTicket || !replyText) return;

    setSending(true);
    try {
      const res = await api.post(`/support/tickets/${activeTicket._id}/reply`, {
        content: replyText,
      });

      if (res.data.success) {
        toast.success('Reply submitted!');
        setModalOpen(false);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customer Support Board</h2>
        <p className="text-sm text-slate-400 mt-1">Review active support requests and reply to client inquiries.</p>
      </div>

      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {tickets.map((t) => (
              <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                <td className="px-6 py-4 font-semibold">{t.user?.name || 'Unknown User'}</td>
                <td className="px-6 py-4 truncate max-w-[200px]">{t.subject}</td>
                <td className="px-6 py-4">{t.category}</td>
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
                    <FiMessageSquare /> Respond
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reply Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Ticket Conversation Thread">
        {activeTicket && (
          <div className="space-y-4">
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <p className="text-xs text-slate-400 font-bold">CLIENT INQUIRY:</p>
              <p className="text-sm font-semibold">{activeTicket.subject}</p>
              <p className="text-xs text-slate-500">{activeTicket.message}</p>
            </div>

            {/* Conversation list */}
            {activeTicket.replies && activeTicket.replies.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Replies History</p>
                {activeTicket.replies.map((reply, idx) => (
                  <div key={idx} className="text-xs p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40">
                    <p className="font-bold mb-1">{reply.sender === activeTicket.user._id ? 'User' : 'Support Team'}</p>
                    <p>{reply.content}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                required
                rows="3"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write reply response to client..."
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-brand hover:bg-brand-dark py-3 text-xs font-semibold text-white transition-all"
              >
                <FiSend /> {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminSupport;
