import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="text-center py-20 space-y-4">
      <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white">404</h2>
      <p className="text-sm text-slate-400">The energy grid path you are searching for does not exist.</p>
      <Link to="/" className="inline-block rounded-full bg-brand px-6 py-2.5 text-xs font-bold text-white hover:bg-brand-dark transition-all">
        Back to Power Grid
      </Link>
    </div>
  );
};

export default NotFound;
