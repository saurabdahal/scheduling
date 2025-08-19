import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';

const Dashboard = ({ user, employees = [], shifts = [], notifications: appNotifications = [] }) => {
  const navigate = useNavigate();
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  
  const [analytics, setAnalytics] = useState({
    totalEmployees: 0,
    totalShifts: 0,
    hoursScheduled: 0,
    hoursWorked: 0,
    laborCost: 0,
    upcomingShifts: 0
  });

  const [recentShifts, setRecentShifts] = useState([]);

  const [notifications, setNotifications] = useState([]);

  // Calculate analytics from real data
  useEffect(() => {
    if (employees && shifts) {
      const totalEmployees = employees.length;
      const totalShifts = shifts.length;
      
      // Calculate hours scheduled
      const hoursScheduled = shifts.reduce((total, shift) => {
        const start = parseISO(`2000-01-01T${shift.startTime}`);
        const end = parseISO(`2000-01-01T${shift.endTime}`);
        const diffMs = end - start;
        return total + Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      }, 0);
      
      // Calculate hours worked (completed shifts)
      const hoursWorked = shifts.filter(shift => shift.status === 'completed').reduce((total, shift) => {
        const start = parseISO(`2000-01-01T${shift.startTime}`);
        const end = parseISO(`2000-01-01T${shift.endTime}`);
        const diffMs = end - start;
        return total + Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      }, 0);
      
      // Calculate labor cost
      const laborCost = shifts.reduce((total, shift) => {
        const employee = employees.find(emp => emp.id === shift.employeeId);
        if (employee) {
          const start = parseISO(`2000-01-01T${shift.startTime}`);
          const end = parseISO(`2000-01-01T${shift.endTime}`);
          const hours = Math.round((end - start) / (1000 * 60 * 60) * 10) / 10;
          return total + (hours * employee.hourlyRate);
        }
        return total;
      }, 0);
      
      // Count upcoming shifts (scheduled for today or future)
      const today = new Date();
      const upcomingShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= today && shift.status === 'scheduled';
      }).length;
      
      setAnalytics({
        totalEmployees,
        totalShifts,
        hoursScheduled,
        hoursWorked,
        laborCost: Math.round(laborCost),
        upcomingShifts
      });
      
      // Get recent shifts (last 5 completed shifts)
      const recent = shifts
        .filter(shift => shift.status === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      
      setRecentShifts(recent);
      
      // Use app notifications if available
      if (appNotifications.length > 0) {
        setNotifications(appNotifications.slice(0, 3));
      }
    }
  }, [employees, shifts, appNotifications]);

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'no-show': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.scheduled;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      warning: (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
      success: (
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    };
    return icons[type] || icons.info;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'User'}!</p>
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdminOrManager && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.totalEmployees}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdminOrManager ? 'Hours Scheduled' : 'My Hours This Week'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.hoursScheduled}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdminOrManager ? 'Hours Worked' : 'My Shifts This Week'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.hoursWorked}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Shifts */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Shifts</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentShifts.length > 0 ? (
                recentShifts.map(shift => {
                  const employee = employees.find(emp => emp.id === shift.employeeId);
                  if (!employee) return null;
                  
                  return (
                    <div key={shift.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                          <p className="text-sm text-gray-500">{shift.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {format(parseISO(shift.date), 'MMM dd')} • {shift.startTime} - {shift.endTime}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shift.status)}`}>
                          {shift.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No shifts completed yet</p>
                  <p className="text-sm">Shifts will appear here once they are completed</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div key={notification.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No notifications</p>
                  <p className="text-sm">Notifications will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isAdminOrManager && (
            <button 
              onClick={() => navigate('/shifts')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm font-medium text-gray-900">Create Shift</p>
              </div>
            </button>
          )}
          
          <button 
            onClick={() => navigate('/timesheet')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">
                {isAdminOrManager ? 'Generate Report' : 'My Timesheet'}
              </p>
            </div>
          </button>
          
          {isAdminOrManager && (
            <button 
              onClick={() => navigate('/payroll')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <p className="text-sm font-medium text-gray-900">Payroll</p>
              </div>
            </button>
          )}
          
          {isAdminOrManager && (
            <button 
              onClick={() => navigate('/staff')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">Staff Management</p>
              </div>
            </button>
          )}
          
          <button 
            onClick={() => navigate('/shifts')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <svg className="w-8 h-8 text-orange-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">
                {isAdminOrManager ? 'View Schedule' : 'My Schedule'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 