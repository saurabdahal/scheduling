import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/TopBar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import StaffManagement from './pages/StaffManagement';
import Timesheet from './pages/Timesheet';
import Shifts from './pages/Shifts';
import SwapShift from './pages/SwapShift';
import Payroll from './pages/Payroll';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (user) => setUser(user);
  const handleLogout = () => setUser(null);

  return (
    <Router>
      {user && <TopBar onLogout={handleLogout} user={user} />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}>
            <Dashboard user={user} />
          </ProtectedRoute>
        } />
        <Route path="/staff" element={
          <ProtectedRoute user={user}>
            <StaffManagement user={user} />
          </ProtectedRoute>
        } />
        <Route path="/timesheet" element={
          <ProtectedRoute user={user}>
            <Timesheet user={user} />
          </ProtectedRoute>
        } />
        <Route path="/shifts" element={
          <ProtectedRoute user={user}>
            <Shifts user={user} />
          </ProtectedRoute>
        } />
        <Route path="/swap-shift" element={
          <ProtectedRoute user={user}>
            <SwapShift user={user} />
          </ProtectedRoute>
        } />
        <Route path="/payroll" element={
          <ProtectedRoute user={user}>
            <Payroll user={user} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
