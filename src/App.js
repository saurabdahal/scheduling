import React, { useState, useEffect, useCallback } from 'react';
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
import { Employee, Notification, Shift, SwapRequest, TimeOffRequest, PayrollRecord } from './models/index.js';
import dataService from './services/DataService.js';
import { populateEmployeeNames, fixUnknownEmployeeNames, linkUsersToEmployees, getEmployeeNameByUserId } from './models/utils.js';

// Generate default password for new employees
const generateDefaultPassword = (employeeName) => {
  const name = employeeName.replace(/\s+/g, '').toLowerCase();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${name}${randomNum}`;
};

function App() {
  const [user, setUser] = useState(() => {
    // Check localStorage for existing authentication on app startup
    const savedUser = localStorage.getItem('staffManager_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Validate authentication on component mount
  useEffect(() => {
    // Check if there's a saved user and validate it
    const savedUser = localStorage.getItem('staffManager_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Basic validation - check if user has required fields
        if (parsedUser && parsedUser.id && parsedUser.username) {
          console.log('Loading saved user:', parsedUser.username);
          setUser(parsedUser);
        } else {
          // Invalid saved user, remove it
          console.log('Invalid saved user data, clearing');
          localStorage.removeItem('staffManager_user');
          setUser(null);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('staffManager_user');
        setUser(null);
      }
    } else {
      console.log('No saved user found');
      setUser(null);
    }
  }, []);



  // Load all data from JSON files on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        console.log('Starting data loading process...');
        
        // Test server connection first
        try {
          const testUsers = await dataService.getAll('users');
          console.log('Server connection test successful, loaded users:', testUsers?.length || 0);
        } catch (error) {
          console.error('Server connection failed:', error);
          console.log('Server not ready, will retry on next login');
          setLoading(false);
          return;
        }

        console.log('Loading all data types...');
        const [
          loadedUsers,
          loadedEmployees,
          loadedShifts,
          loadedSwapRequests,
          loadedTimeOffRequests,
          loadedPayrollRecords,
          loadedDepartments,
          loadedNotifications
        ] = await Promise.all([
          dataService.getAll('users'),
          dataService.getAll('employees'),
          dataService.getAll('shifts'),
          dataService.getAll('swapRequests'),
          dataService.getAll('timeOffRequests'),
          dataService.getAll('payrollRecords'),
          dataService.getAll('departments'),
          dataService.getAll('notifications')
        ]);

        console.log('Data loading completed:');
        console.log('- Users:', loadedUsers?.length || 0);
        console.log('- Employees:', loadedEmployees?.length || 0);
        console.log('- Shifts:', loadedShifts?.length || 0);
        console.log('- Swap Requests:', loadedSwapRequests?.length || 0);
        console.log('- Time Off Requests:', loadedTimeOffRequests?.length || 0);
        console.log('- Payroll Records:', loadedPayrollRecords?.length || 0);
        console.log('- Departments:', loadedDepartments?.length || 0);
        console.log('- Notifications:', loadedNotifications?.length || 0);
        
        // First, link users to employees by email to establish proper relationships
        const employeesWithUserLinks = linkUsersToEmployees(loadedUsers || [], loadedEmployees || []);
        setUsers(loadedUsers || []);
        setEmployees(employeesWithUserLinks);
        
        // Populate employee names for all data types to fix "Unknown Employee" issue
        const employeesWithNames = employeesWithUserLinks;
        
        // Fix existing data that has "Unknown" employee names
        const fixedShifts = fixUnknownEmployeeNames(loadedShifts || [], employeesWithNames);
        const fixedSwapRequests = fixUnknownEmployeeNames(loadedSwapRequests || [], employeesWithNames);
        const fixedTimeOffRequests = fixUnknownEmployeeNames(loadedTimeOffRequests || [], employeesWithNames);
        const fixedPayrollRecords = fixUnknownEmployeeNames(loadedPayrollRecords || [], employeesWithNames);
        
        // Populate any remaining missing employee names
        const finalShifts = populateEmployeeNames(fixedShifts, employeesWithNames);
        const finalSwapRequests = populateEmployeeNames(fixedSwapRequests, employeesWithNames);
        const finalTimeOffRequests = populateEmployeeNames(fixedTimeOffRequests, employeesWithNames);
        const finalPayrollRecords = populateEmployeeNames(fixedPayrollRecords, employeesWithNames);
        
        // Convert back to model instances after utility functions have processed them
        const finalShiftsAsModels = finalShifts.map(shiftData => new Shift(shiftData));
        const finalSwapRequestsAsModels = finalSwapRequests.map(requestData => new SwapRequest(requestData));
        const finalTimeOffRequestsAsModels = finalTimeOffRequests.map(requestData => new TimeOffRequest(requestData));
        const finalPayrollRecordsAsModels = finalPayrollRecords.map(recordData => new PayrollRecord(recordData));
        
        setShifts(finalShiftsAsModels);
        setSwapRequests(finalSwapRequestsAsModels);
        setTimeOffRequests(finalTimeOffRequestsAsModels);
        setPayrollRecords(finalPayrollRecordsAsModels);
        setDepartments(loadedDepartments || []);
        // Sort notifications by createdAt in descending order (newest first)
        const sortedNotifications = (loadedNotifications || []).sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        setNotifications(sortedNotifications);
        
        // Save the fixed data back to files to permanently resolve "Unknown Employee" issue
        try {
          if (finalShifts.length > 0) await dataService.saveData('shifts', finalShifts);
          if (finalSwapRequests.length > 0) await dataService.saveData('swapRequests', finalSwapRequests);
          if (finalTimeOffRequests.length > 0) await dataService.saveData('timeOffRequests', finalTimeOffRequests);
          if (finalPayrollRecords.length > 0) await dataService.saveData('payrollRecords', finalPayrollRecords);
          console.log('Fixed data saved back to files');
        } catch (error) {
          console.error('Error saving fixed data:', error);
        }
        
        console.log('State updated with loaded data');
        
        // User validation will be handled separately when user state changes
      } catch (error) {
        console.error('Error loading data:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } finally {
        setLoading(false);
        console.log('Data loading process finished');
      }
    };
    
    loadAllData();
    
    // Sample notifications removed to prevent random notifications
  }, []); // Only load data once on mount

  // Periodically refresh notifications to catch new ones
  useEffect(() => {
    if (!user) return;
    
    const refreshNotifications = async () => {
      try {
        const latestNotifications = await dataService.getAll('notifications');
        console.log('Refreshing notifications:', { 
          count: latestNotifications.length, 
          latest: latestNotifications.slice(0, 2) // Log first 2 for debugging
        });
        
        // Sort notifications by createdAt in descending order (newest first)
        const sortedNotifications = latestNotifications.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        // Only update if there are actually new notifications to prevent unnecessary re-renders
        if (latestNotifications.length !== notifications.length) {
          setNotifications(sortedNotifications);
        }
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      }
    };

    // Refresh immediately on mount
    refreshNotifications();
    
    // Then refresh every 60 seconds (less aggressive to prevent duplicates)
    const notificationInterval = setInterval(refreshNotifications, 60000);

    return () => clearInterval(notificationInterval);
  }, [user]); // Remove notifications dependency to prevent infinite loop

  const handleLogin = (user) => {
    setUser(user);
    // Persist user authentication in localStorage
    localStorage.setItem('staffManager_user', JSON.stringify(user));
  };
  
  const handleLogout = useCallback(() => {
    console.log('=== LOGOUT INITIATED ===');
    console.log('Current location before logout:', window.location.href);
    console.log('LocalStorage before clear:', localStorage.getItem('staffManager_user'));
    
    // Clear ALL session data FIRST before changing state
    localStorage.clear();
    sessionStorage.clear();
    console.log('All storage cleared');
    console.log('LocalStorage after clear:', localStorage.getItem('staffManager_user'));
    
    // Clear any cookies that might exist
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('Cookies cleared');
    
    // Clear user state AFTER storage is cleared
    setUser(null);
    console.log('User state cleared');
    
    // Force immediate redirect to login with full page reload
    console.log('Forcing redirect to login page with full reload');
    window.location.href = '/login';
  }, []);

  // Validate saved user authentication against loaded users
  const validateSavedUser = useCallback((loadedUsers) => {
    if (!user || !loadedUsers) return;
    
    // Don't validate if localStorage doesn't have the user (means logout happened)
    const savedUser = localStorage.getItem('staffManager_user');
    if (!savedUser) {
      console.log('No saved user in localStorage, skipping validation');
      return;
    }
    
    // Check if the saved user still exists in the users list
    const userExists = loadedUsers.find(u => u.id === user.id);
    if (!userExists) {
      console.log('Saved user no longer exists, logging out');
      // Clear user state and redirect to login
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      window.location.replace('/login');
      return;
    }
    
    // Check if user is still active
    if (userExists.isActive === false) {
      console.log('Saved user is no longer active, logging out');
      // Clear user state and redirect to login
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      window.location.replace('/login');
      return;
    }
    
    // Update user with latest data from server only if localStorage still has user
    const updatedUser = { ...user, ...userExists };
    setUser(updatedUser);
    localStorage.setItem('staffManager_user', JSON.stringify(updatedUser));
    console.log('User authentication validated and updated');
  }, [user]);

  // Validate saved user when users data is loaded and user exists
  useEffect(() => {
    if (user && users.length > 0) {
      validateSavedUser(users);
    }
  }, [user, users, validateSavedUser]);



  // Handle session timeout and security
  useEffect(() => {
    if (!user) return;

    // Set up activity monitoring for session timeout
    let activityTimeout;
    
    const resetActivityTimeout = () => {
      if (activityTimeout) clearTimeout(activityTimeout);
      // Set timeout to 8 hours (28800000 ms) of inactivity
      activityTimeout = setTimeout(() => {
        console.log('Session timeout due to inactivity');
        handleLogout();
      }, 28800000);
    };

    // Reset timeout on user activity
    const handleUserActivity = () => {
      resetActivityTimeout();
    };

    // Set up event listeners for user activity
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);
    document.addEventListener('click', handleUserActivity);

    // Initialize timeout
    resetActivityTimeout();

    // Cleanup
    return () => {
      if (activityTimeout) clearTimeout(activityTimeout);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('click', handleUserActivity);
    };
  }, [user, handleLogout]);

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

  // Sample notification creation removed to prevent random notifications

  // Add new data functions
  const addSwapRequest = async (request) => {
    try {
      const savedRequest = await dataService.saveSwapRequest(request);
      setSwapRequests([...swapRequests, savedRequest]);
      
      // Find managers to notify
      const managers = employees.filter(emp => emp.role === 'Manager' || emp.role === 'Admin');
      
      // Create notification for each manager
      for (const manager of managers) {
        // Find the user ID for the manager by matching email
        const managerUser = users.find(u => u.email === manager.email);
        
        if (managerUser) {
          const notification = new Notification({
            type: 'swap_request',
            title: 'New Swap Request',
            message: `${request.requesterName} requested a shift swap`,
            priority: 'medium',
            userId: managerUser.id, // Set userId for the recipient
            recipientRole: 'Manager', // Role-based for managers
            recipientId: managerUser.id, // Specific manager user ID
            createdBy: request.requesterName,
            category: 'swap', // Set proper category
            actionUrl: '/swap-shift', // Set proper action URL
            actionText: 'Review Request', // Set proper action text
            metadata: {
              actionType: 'created',
              createdBy: request.requesterName,
              createdAt: new Date().toISOString(),
              requestDetails: `Shift swap request by ${request.requesterName}`
            }
          });
          
          await dataService.saveNotification(notification);
          
          // Add new notification and maintain sorting by recent first
          const updatedNotifications = [...notifications, notification].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          setNotifications(updatedNotifications);
        }
      }
      
      return savedRequest;
    } catch (error) {
      console.error('Error adding swap request:', error);
      throw error;
    }
  };

  const addTimeOffRequest = async (request) => {
    try {
      // Ensure the request has the proper employee name
      if (request.employeeId && !request.employeeName) {
        const employee = employees.find(emp => emp.id === request.employeeId);
        if (employee) {
          request.employeeName = employee.name;
        }
      }
      
      const savedRequest = await dataService.saveTimeOffRequest(request);
      setTimeOffRequests([...timeOffRequests, savedRequest]);
      
      // Find managers to notify
      const managers = employees.filter(emp => emp.role === 'Manager' || emp.role === 'Admin');
      
      // Create notification for each manager
      for (const manager of managers) {
        // Find the user ID for the manager by matching email
        const managerUser = users.find(u => u.email === manager.email);
        
        if (managerUser) {
          const notification = new Notification({
            type: 'time_off_request',
            title: 'New Time Off Request',
            message: `${request.employeeName} requested time off`,
            priority: 'medium',
            userId: managerUser.id, // Set userId for the recipient
            recipientRole: 'Manager', // Role-based for managers
            recipientId: managerUser.id, // Specific manager user ID
            createdBy: request.employeeName,
            category: 'timeoff', // Set proper category
            actionUrl: '/swap-shift', // Set proper action URL
            actionText: 'Review Request', // Set proper action text
            metadata: {
              actionType: 'created',
              createdBy: request.employeeName,
              createdAt: new Date().toISOString(),
              requestDetails: `Time off request by ${request.employeeName}`
            }
          });
          
          await dataService.saveNotification(notification);
          
          // Add new notification and maintain sorting by recent first
          const updatedNotifications = [...notifications, notification].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          setNotifications(updatedNotifications);
        }
      }
      
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
          // Find the employee name for the recipient
          const employee = employees.find(emp => emp.id === request.requesterId);
          const recipientName = employee ? employee.name : 'Employee';
          
          const notification = new Notification({
            type: 'swap_response',
            title: `Swap Request ${status}`,
            message: `Your swap request has been ${status}`,
            priority: 'medium',
            userId: request.requesterId,
            recipientRole: 'Employee', // Role-based for employee
            recipientId: request.requesterId, // Specific employee user ID
            createdBy: 'Manager',
            metadata: {
              actionType: status === 'approved' ? 'approved' : 'rejected',
              [status === 'approved' ? 'approvedBy' : 'rejectedBy']: 'Manager',
              [status === 'approved' ? 'approvedAt' : 'rejectedAt']: new Date().toISOString(),
              requestDetails: `Swap request ${status} by manager`
            }
          });
          await dataService.saveNotification(notification);
          // Add new notification and maintain sorting by recent first
          const updatedNotifications = [...notifications, notification].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          setNotifications(updatedNotifications);
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
          // Find the employee name for the recipient
          const employee = employees.find(emp => emp.id === request.employeeId);
          const recipientName = employee ? employee.name : 'Employee';
          
          const notification = new Notification({
            type: 'time_off_response',
            title: `Time Off Request ${status}`,
            message: `Your time off request has been ${status}`,
            priority: 'medium',
            userId: request.employeeId,
            recipientRole: 'Employee', // Role-based for employee
            recipientId: request.employeeId, // Specific employee user ID
            createdBy: 'Manager',
            metadata: {
              actionType: status === 'approved' ? 'approved' : 'rejected',
              [status === 'approved' ? 'approvedBy' : 'rejectedBy']: 'Manager',
              [status === 'approved' ? 'approvedAt' : 'rejectedAt']: new Date().toISOString(),
              requestDetails: `Time off request ${status} by manager`
            }
          });
          await dataService.saveNotification(notification);
          // Add new notification and maintain sorting by recent first
          const updatedNotifications = [...notifications, notification].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          setNotifications(updatedNotifications);
        }
    } catch (error) {
      console.error('Error updating time off request status:', error);
    }
  };

  return (
    <Router>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading application data...</p>
            <p className="text-sm text-gray-400 mt-2">Please wait while we connect to the server</p>
          </div>
        </div>
      ) : (
        <>
          {user && <TopBar onLogout={handleLogout} user={user} notifications={notifications} onNotificationsUpdate={updateNotifications} employees={employees} />}
          <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} />
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
              users={users}
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
        </>
      )}
    </Router>
  );
}

export default App;
