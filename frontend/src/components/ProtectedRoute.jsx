import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their respective dashboard
    const defaultRedirect = {
      Customer: '/customer/dashboard',
      Investor: '/investor/dashboard',
      Engineer: '/engineer/dashboard',
      Admin: '/admin/dashboard',
    };
    return <Navigate to={defaultRedirect[user.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
