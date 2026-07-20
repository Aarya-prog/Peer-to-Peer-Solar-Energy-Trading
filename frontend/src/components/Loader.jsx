import React from 'react';

export const Spinner = () => {
  return (
    <div className="flex justify-center items-center py-6">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="glass-panel animate-pulse rounded-3xl p-6 space-y-4 shadow-glass">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full pt-4"></div>
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="w-full animate-pulse space-y-4">
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
    </div>
  );
};
