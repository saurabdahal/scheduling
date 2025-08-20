import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import notificationService from '../services/NotificationService.js';
import { getEmployeeNameByEmail } from '../models/utils.js';

const TopBar = ({ onLogout, user, notifications = [], onNotificationsUpdate, employees = [] }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [notificationDropdown, setNotificationDropdown] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef();
  const notificationRef = useRef();

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const success = await notificationService.markAsRead(notificationId);
      if (success) {
        // Update local notifications state
        const updatedNotifications = notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        );
        // Update parent state
        if (onNotificationsUpdate) {
          onNotificationsUpdate(updatedNotifications);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const success = await notificationService.markAllAsRead(user.id, user.role);
      if (success) {
        // Update local notifications state
        const updatedNotifications = notifications.map(n => ({ 
          ...n, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }));
        // Update parent state
        if (onNotificationsUpdate) {
          onNotificationsUpdate(updatedNotifications);
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  
  // Get display name for user (full name from employee record or fallback to username)
  const getDisplayName = () => {
    if (user?.email && employees.length > 0) {
      const employeeName = getEmployeeNameByEmail(user.email, employees);
      if (employeeName) return employeeName;
    }
    return user?.username || 'Unknown User';
  };
  
  // Filter notifications for current user (both read and unread)
  const userNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0 || !user) return [];
    
    console.log('Filtering notifications:', { 
      notificationsCount: notifications.length, 
      user: user?.id, 
      userRole: user?.role,
      notifications: notifications.slice(0, 3) // Log first 3 for debugging
    });
    
    return notifications.filter(notification => {
      // Skip invalid notifications
      if (!notification.id) {
        console.log('Skipping notification without ID:', notification);
        return false;
      }
      
      // For debugging, log all notifications being processed
      console.log('Processing notification:', {
        id: notification.id,
        title: notification.title,
        userId: notification.userId,
        recipientId: notification.recipientId,
        recipientRole: notification.recipientRole,
        recipientType: notification.recipientType,
        userRole: user.role
      });
      
      // 1. Direct user notifications (userId or recipientId matches)
      const isDirectUserNotification = 
        notification.userId === user.id || 
        notification.recipientId === user.id;
      
      // 2. Role-based notifications (for Admin/Manager)
      const isRoleBasedNotification = 
        notification.recipientRole && 
        notification.recipientRole === user.role;
      
      // 3. General notifications for all users
      const isGeneralNotification = 
        notification.recipientType === 'all' || 
        !notification.recipientRole;
      
      // 4. Admin/Manager specific notifications (show to all admins/managers)
      const isAdminManagerNotification = 
        (user.role === 'Admin' || user.role === 'Manager') &&
        (notification.recipientRole === 'Admin' || notification.recipientRole === 'Manager');
      
      const shouldShow = isDirectUserNotification || 
                        isRoleBasedNotification || 
                        isGeneralNotification || 
                        isAdminManagerNotification;
      
      console.log('Notification decision:', {
        id: notification.id,
        title: notification.title,
        shouldShow,
        reasons: {
          isDirectUserNotification,
          isRoleBasedNotification,
          isGeneralNotification,
          isAdminManagerNotification
        }
      });
      
      return shouldShow;
    });
  }, [notifications, user]);

  // Filter for unread notifications only (for badge count)
  const unreadNotifications = useMemo(() => {
    return userNotifications.filter(notification => !notification.isRead);
  }, [userNotifications]);
  
  const menuItems = [
    { to: '/dashboard', label: 'Dashboard' },
    ...(isAdminOrManager ? [{ to: '/staff', label: 'Staff' }] : []),
    { to: '/timesheet', label: isAdminOrManager ? 'Timesheet' : 'My Timesheet' },
    { to: '/shifts', label: isAdminOrManager ? 'Calendar' : 'My Schedule' },
    { to: '/swap-shift', label: 'Swap Shift' },
    { to: '/payroll', label: 'Payroll' },
  ];

  useEffect(() => {
    if (!userDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdown]);

  return (
    <nav className="bg-blue-800 text-white px-4 py-3 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="font-extrabold text-2xl tracking-tight text-white">StaffManager</span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2 lg:gap-6">
          {menuItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-2 rounded-md font-medium transition-colors duration-150 ${location.pathname === item.to ? 'bg-blue-900 text-white' : 'hover:bg-blue-700 hover:text-white text-blue-100'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Notifications */}
        <div className="relative flex items-center gap-2" ref={notificationRef}>
          <button
            onClick={() => setNotificationDropdown(v => !v)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10 17h5l-5 5v-5zM5 17h5l-5 5v-5zM15 12h5l-5 5v-5zM10 12h5l-5 5v-5zM5 12h5l-5 5v-5zM15 7h5l-5 5v-5zM10 7h5l-5 5v-5zM5 7h5l-5 5v-5z" />
            </svg>
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center notification-badge">
                {unreadNotifications.length}
              </span>
            )}
            {userNotifications.length > 0 && unreadNotifications.length === 0 && (
              <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </span>
            )}
          </button>
          <NotificationDropdown
            notifications={userNotifications}
            isOpen={notificationDropdown}
            onClose={() => setNotificationDropdown(false)}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        </div>

        {/* User Dropdown */}
        <div className="relative flex items-center gap-2" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdown(v => !v)}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-150"
          >
            {/* Avatar Icon */}
            <div className="hidden sm:flex w-8 h-8 bg-blue-600 rounded-full items-center justify-center border-2 border-blue-400">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium text-white">{getDisplayName()}</span>
              <span className="text-xs text-blue-100">{user?.role}</span>
            </div>
            
            <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {userDropdown && (
            <div className="absolute left-0 right-auto mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl z-50 animate-fade-in border border-gray-100" style={{ minWidth: '200px', top: '100%' }}>
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <div className="text-xs text-gray-500 mb-1">Signed in as</div>
                <div className="font-semibold text-gray-900">{getDisplayName()}</div>
                <div className="text-xs text-gray-500 mt-1">{user?.email}</div>
              </div>
              <button
                onClick={() => {
                  console.log('Desktop logout button clicked');
                  setUserDropdown(false);
                  console.log('Dropdown closed, calling onLogout');
                  onLogout();
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium rounded-b-lg transition-colors duration-150 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden ml-2 p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => setMenuOpen(v => !v)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-2 bg-blue-700 rounded-lg shadow-lg animate-fade-in border border-blue-600">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-blue-600 bg-blue-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center border-2 border-blue-300 flex">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white">{getDisplayName()}</div>
                <div className="text-xs text-blue-200">{user?.email}</div>
                <div className="text-xs text-blue-300 mt-1">{user?.role}</div>
              </div>
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="flex flex-col gap-1 py-2">
            {menuItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-150 ${location.pathname === item.to ? 'bg-blue-900 text-white' : 'hover:bg-blue-800 hover:text-white text-blue-100'}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                console.log('Mobile logout button clicked');
                setMenuOpen(false);
                console.log('Mobile menu closed, calling onLogout');
                onLogout();
              }}
              className="w-full text-left px-4 py-2 mt-2 mx-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-150 flex items-center gap-2 justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopBar; 