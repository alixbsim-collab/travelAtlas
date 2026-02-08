import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import TravelDesignerPage from './pages/TravelDesignerPage';
import TravelDesignerDashboard from './pages/TravelDesignerDashboard';
import CreateItineraryPage from './pages/CreateItineraryPage';
import PlannerPage from './pages/PlannerPage';
import AtlasFilesPage from './pages/AtlasFilesPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Pages with MainLayout */}
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
        <Route path="/designer" element={<MainLayout><TravelDesignerDashboard /></MainLayout>} />
        <Route path="/designer/create" element={<MainLayout><CreateItineraryPage /></MainLayout>} />
        <Route path="/atlas" element={<MainLayout><AtlasFilesPage /></MainLayout>} />
        <Route path="/atlas/:id" element={<MainLayout><AtlasFilesPage /></MainLayout>} />
        <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
        <Route path="/login" element={<MainLayout><LoginPage /></MainLayout>} />
        <Route path="/register" element={<MainLayout><RegisterPage /></MainLayout>} />
        <Route path="/forgot-password" element={<MainLayout><ForgotPasswordPage /></MainLayout>} />
        <Route path="/reset-password" element={<MainLayout><ResetPasswordPage /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><HomePage /></MainLayout>} />

        {/* Planner page without MainLayout (full screen) */}
        <Route path="/designer/planner/:id" element={<PlannerPage />} />
        <Route path="/designer/edit/:id" element={<PlannerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
