import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid,
  FiShoppingBag,
  FiFileText,
  FiHelpCircle,
  FiBriefcase,
  FiTrendingUp,
  FiTool,
  FiUsers,
  FiVolume2,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign
} from 'react-icons/fi';

const Sidebar = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const roleMenus = {
    Customer: [
      { name: 'Overview', path: '/customer/dashboard', icon: <FiGrid /> },
      { name: 'My Wallet', path: '/customer/wallet', icon: <FiDollarSign /> },
      { name: 'Metrics Analysis', path: '/customer/metrics', icon: <FiTrendingUp /> },
      { name: 'My Subscription', path: '/my-subscription', icon: <FiFileText /> },
      { name: 'Buy Green Energy', path: '/marketplace', icon: <FiShoppingBag /> },
      { name: 'Energy Plans', path: '/plans', icon: <FiFileText /> },
      { name: 'Install Solar', path: '/install-solar', icon: <FiTool /> },
      { name: 'Bills & PDF', path: '/customer/billing', icon: <FiFileText /> },
      { name: 'Help Support', path: '/support/tickets', icon: <FiHelpCircle /> },
    ],
    Investor: [
      { name: 'Dashboard', path: '/investor/dashboard', icon: <FiGrid /> },
      { name: 'My Wallet', path: '/investor/wallet', icon: <FiDollarSign /> },
      { name: 'Explore Projects', path: '/investments/projects', icon: <FiBriefcase /> },
      { name: 'My Portfolio', path: '/investor/portfolio', icon: <FiTrendingUp /> },
      { name: 'Help Support', path: '/support/tickets', icon: <FiHelpCircle /> },
    ],
    Admin: [
      { name: 'Metrics Analytics', path: '/admin/dashboard', icon: <FiGrid /> },
      { name: 'Active Users', path: '/admin/users', icon: <FiUsers /> },
      { name: 'Solar Projects', path: '/admin/projects', icon: <FiBriefcase /> },
      { name: 'Installation Tracker', path: '/admin/installations', icon: <FiTool /> },
      { name: 'Energy Plans', path: '/admin/plans', icon: <FiFileText /> },
      { name: 'Support Board', path: '/admin/support', icon: <FiHelpCircle /> },
      { name: 'Announcements', path: '/admin/announcements', icon: <FiVolume2 /> },
    ],
  };

  const menuItems = roleMenus[user.role] || [];

  return (
    <aside className={`glass-panel min-h-[calc(100vh-6rem)] rounded-3xl py-6 px-4 shadow-glass hidden md:flex flex-col justify-between transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-brand text-white p-1 rounded-full shadow-lg border border-white/20 hover:scale-110 transition-transform z-20"
      >
        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      <div>
        <div className="mb-6 px-3 flex justify-between items-center">
          {!isCollapsed && (
            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase truncate">
              {user.role} Menu
            </p>
          )}
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand text-white shadow-md shadow-green-500/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                } ${isCollapsed ? 'justify-center px-2' : ''}`
              }
              title={isCollapsed ? item.name : ''}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {!isCollapsed && (
        <div className="px-3 pt-6 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 text-center">
          Solar Trade © 2026
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
