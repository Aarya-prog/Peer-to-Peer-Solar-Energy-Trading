import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid,
  FiShoppingBag,
  FiFileText,
  FiHelpCircle,
  FiSettings,
  FiBriefcase,
  FiTrendingUp,
  FiTool,
  FiUsers,
  FiVolume2
} from 'react-icons/fi';

const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  const roleMenus = {
    Customer: [
      { name: 'Overview', path: '/customer/dashboard', icon: <FiGrid /> },
      { name: 'My Subscription', path: '/my-subscription', icon: <FiFileText /> },
      { name: 'Buy Green Energy', path: '/marketplace', icon: <FiShoppingBag /> },
      { name: 'Energy Plans', path: '/plans', icon: <FiFileText /> },
      { name: 'Install Solar', path: '/install-solar', icon: <FiTool /> },
      { name: 'Bills & PDF', path: '/customer/billing', icon: <FiFileText /> },
      { name: 'Help Support', path: '/support/tickets', icon: <FiHelpCircle /> },
    ],
    Investor: [
      { name: 'Dashboard', path: '/investor/dashboard', icon: <FiGrid /> },
      { name: 'Explore Projects', path: '/investments/projects', icon: <FiBriefcase /> },
      { name: 'My Portfolio', path: '/investor/portfolio', icon: <FiTrendingUp /> },
      { name: 'Help Support', path: '/support/tickets', icon: <FiHelpCircle /> },
    ],
    Engineer: [
      { name: 'Assigned Installations', path: '/engineer/dashboard', icon: <FiTool /> },
      { name: 'Maintenance Visits', path: '/engineer/maintenance', icon: <FiTool /> },
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
    <aside className="glass-panel w-64 min-h-[calc(100vh-4rem)] rounded-r-3xl py-6 px-4 shadow-glass hidden md:block">
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Menu ({user.role})</p>
      </div>
      <nav className="space-y-1.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-md shadow-green-500/20'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
