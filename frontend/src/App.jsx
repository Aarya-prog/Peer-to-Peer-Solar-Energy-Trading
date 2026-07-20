import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout & Core components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/404';

// Customer Pages
import CustomerDashboard from './pages/CustomerDashboard';
import Billing from './pages/Billing';
import MySubscription from './pages/MySubscription';
import Marketplace from './pages/Marketplace';
import EnergyPlans from './pages/EnergyPlans';
import InstallSolar from './pages/InstallSolar';
import SupportTickets from './pages/SupportTickets';
import Profile from './pages/Profile';

// Investor Pages
import InvestorDashboard from './pages/InvestorDashboard';
import ProjectsExplorer from './pages/ProjectsExplorer';

// Engineer Pages
import EngineerDashboard from './pages/EngineerDashboard';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminProjects from './pages/AdminProjects';
import AdminInstallations from './pages/AdminInstallations';
import AdminPlans from './pages/AdminPlans';
import AdminSupport from './pages/AdminSupport';
import AdminAnnouncements from './pages/AdminAnnouncements';

// Layout Wrappers
const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </main>
    <Footer />
  </div>
);

const DashboardLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-6">
      <Sidebar />
      <main className="flex-1 min-h-[60vh] max-w-full overflow-hidden">
        {children}
      </main>
    </div>
    <Footer />
  </div>
);

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-right" reverseOrder={false} />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
              <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
              <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
              <Route path="/reset-password/:token" element={<PublicLayout><ResetPassword /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
              <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
              <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
              <Route path="/privacy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />

              {/* Customer Routes */}
              <Route path="/customer/dashboard" element={<ProtectedRoute allowedRoles={['Customer']}><DashboardLayout><CustomerDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/customer/billing" element={<ProtectedRoute allowedRoles={['Customer']}><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
              <Route path="/my-subscription" element={<ProtectedRoute allowedRoles={['Customer']}><DashboardLayout><MySubscription /></DashboardLayout></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute allowedRoles={['Customer', 'Admin']}><DashboardLayout><Marketplace /></DashboardLayout></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute allowedRoles={['Customer', 'Admin']}><DashboardLayout><EnergyPlans /></DashboardLayout></ProtectedRoute>} />
              <Route path="/install-solar" element={<ProtectedRoute allowedRoles={['Customer']}><DashboardLayout><InstallSolar /></DashboardLayout></ProtectedRoute>} />

              {/* Investor Routes */}
              <Route path="/investor/dashboard" element={<ProtectedRoute allowedRoles={['Investor']}><DashboardLayout><InvestorDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/investor/portfolio" element={<ProtectedRoute allowedRoles={['Investor']}><DashboardLayout><InvestorDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/investments/projects" element={<ProtectedRoute allowedRoles={['Investor']}><DashboardLayout><ProjectsExplorer /></DashboardLayout></ProtectedRoute>} />

              {/* Engineer Routes */}
              <Route path="/engineer/dashboard" element={<ProtectedRoute allowedRoles={['Engineer']}><DashboardLayout><EngineerDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/engineer/maintenance" element={<ProtectedRoute allowedRoles={['Engineer']}><DashboardLayout><EngineerDashboard /></DashboardLayout></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout><AdminUsers /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout><AdminProjects /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/installations" element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout><AdminInstallations /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/plans" element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout><AdminPlans /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/support" element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout><AdminSupport /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout><AdminAnnouncements /></DashboardLayout></ProtectedRoute>} />

              {/* Shared Routes */}
              <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
              <Route path="/support/tickets" element={<ProtectedRoute><DashboardLayout><SupportTickets /></DashboardLayout></ProtectedRoute>} />

              {/* 404 Route */}
              <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
