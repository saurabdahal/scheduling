import React, { useState, useEffect } from 'react';
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
import ModelTest from './components/ModelTest';
import { Employee, Notification } from './models/index.js';
import dataService from './services/DataService.js';

// Generate default password for new employees
const generateDefaultPassword = (employeeName) => {
  const name = employeeName.replace(/\s+/g, '').toLowerCase();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${name}${randomNum}`;
};

function App() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all data from JSON files on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Ensure data is loaded from server
        try {
          await dataService.getAll('users');
        } catch (error) {
          console.log('Server not ready, will retry on next login');
        }

        const [
          loadedEmployees,
          loadedShifts,
          loadedSwapRequests,
          loadedTimeOffRequests,
          loadedPayrollRecords,
          loadedDepartments,
          loadedNotifications
        ] = await Promise.all([
          dataService.getAll('employees'),
          dataService.getAll('shifts'),
          dataService.getAll('swapRequests'),
          dataService.getAll('timeOffRequests'),
          dataService.getAll('payrollRecords'),
          dataService.getAll('departments'),
          dataService.getAll('notifications')
        ]);

        setEmployees(loadedEmployees);
        setShifts(loadedShifts);
        setSwapRequests(loadedSwapRequests);
        setTimeOffRequests(loadedTimeOffRequests);
        setPayrollRecords(loadedPayrollRecords);
        setDepartments(loadedDepartments);
        setNotifications(loadedNotifications);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  const handleLogin = (user) => setUser(user);
  const handleLogout = () => setUser(null);

  const handleAddEmployee = async (employeeData) => {
    const newEmployee = new Employee({
      ...employeeData,
      id: Date.now(),
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });
    
    try {
      // Save employee first
      const savedEmployee = await dataService.saveEmployee(newEmployee);
      setEmployees([...employees, savedEmployee]);
      
      // Also create a linked minimal user if not present
      const existingUsers = await dataService.getAll('users');
      const hasUser = existingUsers.some(u => u.email === newEmployee.email);
      if (!hasUser) {
        // Generate a default password based on employee name
        const defaultPassword = generateDefaultPassword(newEmployee.name);
        
        const linkedUser = {
          id: Date.now() + 1,
          username: (newEmployee.email || newEmployee.name.replace(/\s+/g, '').toLowerCase()),
          password: defaultPassword,
          role: newEmployee.role || 'Employee',
          email: newEmployee.email || `${newEmployee.name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          permissions: []
        };
        const updatedUsers = [...existingUsers, linkedUser];
        await dataService.saveData('users', updatedUsers);
        
        // Show success message with login credentials
        alert(`Employee ${newEmployee.name} created successfully!\n\nLogin Credentials:\nUsername: ${linkedUser.username}\nPassword: ${defaultPassword}\n\nPlease share these credentials with the employee.`);
        
        console.log('Created linked user for new employee with password:', defaultPassword);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleUpdateEmployee = async (employeeId, employeeData) => {
    try {
      const updatedEmployee = await dataService.update('employees', employeeId, employeeData);
      if (updatedEmployee) {
        setEmployees(employees.map(emp => 
          emp.id === employeeId ? updatedEmployee : emp
        ));
      }
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    try {
      await dataService.delete('employees', employeeId);
      setEmployees(employees.filter(emp => emp.id !== employeeId));
      // Optional: do not auto-delete users; keep login entries unless explicitly managed
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  // Data update functions for syncing across components
  const updateShifts = async (newShifts) => {
    setShifts(newShifts);
  };

  const updateSwapRequests = async (newSwapRequests) => {
    setSwapRequests(newSwapRequests);
  };

  const updateTimeOffRequests = async (newTimeOffRequests) => {
    setTimeOffRequests(newTimeOffRequests);
  };

  const updatePayrollRecords = async (newPayrollRecords) => {
    setPayrollRecords(newPayrollRecords);
  };

  const updateNotifications = async (newNotifications) => {
    setNotifications(newNotifications);
  };

  // Add new data functions
  const addSwapRequest = async (request) => {
    try {
      const savedRequest = await dataService.saveSwapRequest(request);
      setSwapRequests([...swapRequests, savedRequest]);
      
      // Create notification for managers
      const notification = new Notification({
        type: 'swap_request',
        title: 'New Swap Request',
        message: `${request.requesterName} requested a shift swap`,
        priority: 'medium',
        recipientRole: 'Manager'
      });
      await dataService.saveNotification(notification);
      setNotifications([...notifications, notification]);
      
      return savedRequest;
    } catch (error) {
      console.error('Error adding swap request:', error);
      throw error;
    }
  };

  const addTimeOffRequest = async (request) => {
    try {
      const savedRequest = await dataService.saveTimeOffRequest(request);
      setTimeOffRequests([...timeOffRequests, savedRequest]);
      
      // Create notification for managers
      const notification = new Notification({
        type: 'time_off_request',
        title: 'New Time Off Request',
        message: `${request.employeeName} requested time off`,
        priority: 'medium',
        recipientRole: 'Manager'
      });
      await dataService.saveNotification(notification);
      setNotifications([...notifications, notification]);
      
      return savedRequest;
    } catch (error) {
      console.error('Error adding time off request:', error);
      throw error;
    }
  };

  const updateSwapRequestStatus = async (requestId, status, reviewedBy) => {
    try {
      const updatedRequests = swapRequests.map(req => {
        if (req.id === requestId) {
          if (status === 'approved') {
            req.approve(reviewedBy, 'Approved by manager');
          } else if (status === 'rejected') {
            req.reject(reviewedBy, 'Rejected by manager');
          }
          return req;
        }
        return req;
      });
      
      setSwapRequests(updatedRequests);
      
      // Save all updated requests
      for (const req of updatedRequests) {
        await dataService.saveSwapRequest(req);
      }
      
      // Create notification for employee
      const request = updatedRequests.find(req => req.id === requestId);
      if (request) {
        const notification = new Notification({
          type: 'swap_response',
          title: `Swap Request ${status}`,
          message: `Your swap request has been ${status}`,
          priority: 'medium',
          userId: request.requesterId
        });
        await dataService.saveNotification(notification);
        setNotifications([...notifications, notification]);
      }
    } catch (error) {
      console.error('Error updating swap request status:', error);
    }
  };

  const updateTimeOffRequestStatus = async (requestId, status, reviewedBy) => {
    try {
      const updatedRequests = timeOffRequests.map(req => {
        if (req.id === requestId) {
          if (status === 'approved') {
            req.approve(reviewedBy, 'Approved by manager');
          } else if (status === 'rejected') {
            req.reject(reviewedBy, 'Rejected by manager');
          }
          return req;
        }
        return req;
      });
      
      setTimeOffRequests(updatedRequests);
      
      // Save all updated requests
      for (const req of updatedRequests) {
        await dataService.saveTimeOffRequest(req);
      }
      
      // Create notification for employee
      const request = updatedRequests.find(req => req.id === requestId);
      if (request) {
        const notification = new Notification({
          type: 'time_off_response',
          title: `Time Off Request ${status}`,
          message: `Your time off request has been ${status}`,
          priority: 'medium',
          userId: request.employeeId
        });
        await dataService.saveNotification(notification);
        setNotifications([...notifications, notification]);
      }
    } catch (error) {
      console.error('Error updating time off request status:', error);
    }
  };

  return (
    <Router>
      {user && <TopBar onLogout={handleLogout} user={user} notifications={notifications} />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}>
            <Dashboard user={user} employees={employees} shifts={shifts} notifications={notifications} />
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
            <Timesheet user={user} employees={employees} shifts={shifts} onUpdateShifts={updateShifts} />
          </ProtectedRoute>
        } />
        <Route path="/shifts" element={
          <ProtectedRoute user={user}>
            <Shifts 
              user={user} 
              employees={employees}
              shifts={shifts}
              onUpdateShifts={updateShifts}
            />
          </ProtectedRoute>
        } />
        <Route path="/swap-shift" element={
          <ProtectedRoute user={user}>
            <SwapShift 
              user={user} 
              employees={employees}
              shifts={shifts}
              swapRequests={swapRequests}
              timeOffRequests={timeOffRequests}
              onAddSwapRequest={addSwapRequest}
              onAddTimeOffRequest={addTimeOffRequest}
              onUpdateSwapRequestStatus={updateSwapRequestStatus}
              onUpdateTimeOffRequestStatus={updateTimeOffRequestStatus}
            />
          </ProtectedRoute>
        } />
        <Route path="/payroll" element={
          <ProtectedRoute user={user}>
            <Payroll 
              user={user}
              employees={employees}
              shifts={shifts}
              payrollRecords={payrollRecords}
              onUpdatePayrollRecords={updatePayrollRecords}
            />
          </ProtectedRoute>
        } />
        <Route path="/test" element={
          <ProtectedRoute user={user}>
            <ModelTest />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
