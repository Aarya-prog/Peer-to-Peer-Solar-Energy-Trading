import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="w-full max-w-none px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">☀️</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">Solar Trade</span>
            <span className="text-xs text-slate-400 font-medium ml-2">© 2026 SolarGrid-Energy. All rights reserved.</span>
          </div>

          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/about" className="hover:text-brand transition-colors">About Us</Link>
            <Link to="/faq" className="hover:text-brand transition-colors">FAQ Support</Link>
            <Link to="/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-brand transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
