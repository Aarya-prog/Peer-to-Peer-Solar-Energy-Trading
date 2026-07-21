import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { FiSun, FiMoon, FiBell, FiUser, FiLogOut, FiMenu, FiX, FiActivity } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { notifications, markRead, deleteNotification } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    return {
      Customer: '/customer/dashboard',
      Investor: '/investor/dashboard',
      Admin: '/admin/dashboard',
    }[user.role] || '/';
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || n.type === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <nav className="glass-nav sticky top-0 z-50 transition-all duration-200">
      <div className="w-full max-w-none px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-brand">
            <span className="text-2xl">☀️</span>
            <span className="bg-gradient-to-r from-brand to-brand-emerald bg-clip-text text-transparent">Solar Trade</span>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/marketplace" className="text-sm font-medium hover:text-brand transition-colors">Marketplace</Link>
            <Link to="/plans" className="text-sm font-medium hover:text-brand transition-colors">Energy Plans</Link>
            <Link to="/about" className="text-sm font-medium hover:text-brand transition-colors">About</Link>
            <Link to="/faq" className="text-sm font-medium hover:text-brand transition-colors">FAQ</Link>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                    }}
                    className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <FiBell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-lime text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="glass-panel absolute right-0 mt-2 w-80 rounded-2xl shadow-premium py-2 max-h-[500px] overflow-y-auto z-50 flex flex-col border border-white/20 dark:border-slate-800">
                      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-sm font-bold">Notifications</span>
                        <span className="text-xs text-slate-400 font-medium">{unreadCount} unread</span>
                      </div>
                      
                      {/* Search Bar */}
                      <div className="px-3 pt-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search notifications..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-[10px] focus:outline-none focus:border-brand"
                        />
                      </div>

                      {/* Category Filters */}
                      <div className="flex gap-1.5 overflow-x-auto px-3 py-2 border-b border-slate-100 dark:border-slate-800 scrollbar-none">
                        {['All', 'Success', 'Warning', 'Info', 'Announcement'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold flex-shrink-0 transition-all ${
                              filterCategory === cat
                                ? 'bg-brand text-white'
                                : 'bg-slate-100 text-slate-400 hover:text-slate-650 dark:bg-slate-850'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Notification List */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-80 overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-slate-400">No matching notifications</div>
                        ) : (
                          filteredNotifications.map((n) => (
                            <div
                              key={n._id}
                              className={`px-4 py-3 flex justify-between items-start hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer ${
                                !n.readStatus ? 'bg-green-50/50 dark:bg-green-950/10' : ''
                              }`}
                            >
                              <div onClick={() => markRead(n._id)} className="flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-250 leading-tight">
                                    {n.title}
                                  </p>
                                  <span className={`text-[8px] px-1 rounded font-bold uppercase ${
                                    n.type === 'Success' ? 'bg-green-500/10 text-green-500' :
                                    n.type === 'Warning' ? 'bg-amber-500/10 text-amber-500' :
                                    n.type === 'Announcement' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-slate-500/10 text-slate-450'
                                  }`}>
                                    {n.type || 'Info'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 leading-normal">{n.message}</p>
                                <span className="text-[8px] text-slate-400 block mt-1">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n._id);
                                }}
                                className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                title="Delete Notification"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="glass-panel absolute right-0 mt-2 w-48 rounded-2xl shadow-premium py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.role}</p>
                      </div>
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FiActivity /> Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FiUser /> Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                      >
                        <FiLogOut /> Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium hover:text-brand transition-colors">Log In</Link>
                <Link
                  to="/register"
                  className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition-all shadow-md shadow-green-500/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Icon */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3">
          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium hover:text-brand"
          >
            Marketplace
          </Link>
          <Link
            to="/plans"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium hover:text-brand"
          >
            Energy Plans
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium hover:text-brand"
          >
            About
          </Link>
          <Link
            to="/faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium hover:text-brand"
          >
            FAQ
          </Link>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            {user ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-brand"
                >
                  Go to Dashboard ({user.role})
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left text-sm font-medium text-red-500"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-full border border-slate-300 dark:border-slate-700 py-2 text-sm font-medium hover:bg-slate-100"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-full bg-brand py-2 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
