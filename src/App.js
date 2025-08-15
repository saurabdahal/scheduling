import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/TopBar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import StaffManagement from './pages/StaffManagement';
import EmployeePage from './pages/EmployeePage';
import Timesheet from './pages/Timesheet';
import Shifts from './pages/Shifts';
import SwapShift from './pages/SwapShift';
import Payroll from './pages/Payroll';

function App() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Alice Johnson', hourlyRate: 18.50, role: 'Manager', email: 'alice.johnson@company.com', phone: '(555) 123-4567', status: 'active', departments: ['barista', 'cashier'], availability: defaultAvailability() },
    { id: 2, name: 'Bob Smith', hourlyRate: 15.00, role: 'Employee', email: 'bob.smith@company.com', phone: '(555) 234-5678', status: 'active', departments: ['cashier', 'cleaning'], availability: defaultAvailability() },
    { id: 3, name: 'Carol Davis', hourlyRate: 16.00, role: 'Employee', email: 'carol.davis@company.com', phone: '(555) 345-6789', status: 'active', departments: ['kitchen', 'food-prep'], availability: defaultAvailability() },
    { id: 4, name: 'David Wilson', hourlyRate: 15.50, role: 'Employee', email: 'david.wilson@company.com', phone: '(555) 456-7890', status: 'active', departments: ['barista', 'coffee-making'], availability: defaultAvailability() },
    { id: 5, name: 'Emma Brown', hourlyRate: 14.50, role: 'Employee', email: 'emma.brown@company.com', phone: '(555) 567-8901', status: 'active', departments: ['cashier'], availability: defaultAvailability() }
  ]);

  const handleLogin = (user) => setUser(user);
  const handleLogout = () => setUser(null);

  const handleAddEmployee = (employeeData) => {
    const newEmployee = {
      ...employeeData,
      id: Date.now(),
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    setEmployees([...employees, newEmployee]);
  };

  const handleUpdateEmployee = (employeeId, employeeData) => {
    setEmployees(employees.map(emp => 
      emp.id === employeeId ? { ...emp, ...employeeData } : emp
    ));
  };

  const handleDeleteEmployee = (employeeId) => {
    setEmployees(employees.filter(emp => emp.id !== employeeId));
  };

  function defaultAvailability() {
    return {
      monday: { available: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
      thursday: { available: true, startTime: '09:00', endTime: '17:00' },
      friday: { available: true, startTime: '09:00', endTime: '17:00' },
      saturday: { available: false, startTime: '09:00', endTime: '17:00' },
      sunday: { available: false, startTime: '09:00', endTime: '17:00' }
    };
  }

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
            <StaffManagement 
              user={user} 
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          </ProtectedRoute>
        } />
        <Route path="/employee" element={
          <ProtectedRoute user={user}>
            <EmployeePage 
              user={user}
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          </ProtectedRoute>
        } />
        <Route path="/employee/:id" element={
          <ProtectedRoute user={user}>
            <EmployeePage 
              user={user}
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          </ProtectedRoute>
        } />
        <Route path="/timesheet" element={
          <ProtectedRoute user={user}>
            <Timesheet user={user} />
          </ProtectedRoute>
        } />
        <Route path="/shifts" element={
          <ProtectedRoute user={user}>
            <Shifts user={user} employees={employees} />
          </ProtectedRoute>
        } />
        <Route path="/swap-shift" element={
          <ProtectedRoute user={user}>
            <SwapShift user={user} employees={employees} />
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
