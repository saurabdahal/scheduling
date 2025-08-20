import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

const NotificationDropdown = ({ 
  notifications = [], 
  isOpen, 
  onClose, 
  onMarkAsRead, 
  onMarkAllAsRead 
}) => {
  const [activeTab, setActiveTab] = useState('unread');
  const dropdownRef = useRef();
  const navigate = useNavigate();

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'read':
        return notifications.filter(n => n.isRead);
      case 'all':
        return notifications;
      default:
        return notifications;
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to relevant page if actionUrl exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    } else {
      // Default navigation based on notification type
      switch (notification.type) {
        case 'shift':
        case 'shift_conflict':
          navigate('/shifts');
          break;
        case 'time_off_request':
        case 'time_off_response':
          navigate('/swap-shift');
          break;
        case 'swap_request':
        case 'swap_response':
          navigate('/swap-shift');
          break;
        case 'payroll':
          navigate('/payroll');
          break;
        case 'staff':
          navigate('/staff');
          break;
        default:
          navigate('/dashboard');
      }
      onClose();
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
  };

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-[500px] bg-white text-gray-800 rounded-xl shadow-2xl z-50 border border-gray-200 backdrop-blur-sm bg-white/95 notification-dropdown"
      style={{ minWidth: '500px', top: '100%' }}
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10 17h5l-5 5v-5zM15 12h5l-5 5v-5zM10 12h5l-5 5v-5zM5 12h5l-5 5v-5zM15 7h5l-5 5v-5zM10 7h5l-5 5v-5zM5 7h5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-500 mt-1">Stay updated with your latest alerts</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
                 <button
           onClick={() => setActiveTab('unread')}
           className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
             activeTab === 'unread'
               ? 'border-blue-500 text-blue-600 bg-blue-50'
               : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
           }`}
         >
          <div className="flex items-center justify-center gap-2">
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                {unreadCount}
              </span>
            )}
          </div>
        </button>
                 <button
           onClick={() => setActiveTab('read')}
           className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
             activeTab === 'read'
               ? 'border-blue-500 text-blue-600 bg-blue-50'
               : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
           }`}
         >
           Read
         </button>
         <button
           onClick={() => setActiveTab('all')}
           className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
             activeTab === 'all'
               ? 'border-blue-500 text-blue-600 bg-blue-50'
               : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
           }`}
         >
           All
         </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[500px] overflow-y-auto">
                 {filteredNotifications.length === 0 ? (
           <div className="px-8 py-16 text-center">
            <div className="text-gray-300 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM10 17h5l-5 5v-5zM5 17h5l-5 5v-5zM15 12h5l-5 5v-5zM10 12h5l-5 5v-5zM5 12h5l-5 5v-5zM15 7h5l-5 5v-5zM10 7h5l-5 5v-5zM5 7h5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm font-medium">
              {activeTab === 'unread' && 'All caught up! No unread notifications'}
              {activeTab === 'read' && 'No read notifications yet'}
              {activeTab === 'all' && 'No notifications yet'}
            </p>
            <p className="text-gray-300 text-xs mt-1">
              {activeTab === 'unread' && 'You\'re all set for now'}
              {activeTab === 'read' && 'Notifications will appear here once read'}
              {activeTab === 'all' && 'Notifications will appear here as they come in'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map(notification => (
                             <div
                 key={notification.id}
                 onClick={() => handleNotificationClick(notification)}
                 className={`px-8 py-6 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-l-4 notification-item ${
                   !notification.isRead 
                     ? 'bg-blue-50 border-l-blue-500 hover:bg-blue-100' 
                     : 'border-l-transparent hover:bg-gray-100'
                 }`}
               >
                                 <div className="flex items-start space-x-4">
                                     {/* Notification Icon */}
                   <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shadow-sm ${
                     notification.type === 'success' ? 'bg-green-100 text-green-700' :
                     notification.type === 'error' ? 'bg-red-100 text-red-700' :
                     notification.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                     notification.type === 'shift' ? 'bg-blue-100 text-blue-700' :
                     notification.type === 'time_off_request' ? 'bg-purple-100 text-purple-700' :
                     notification.type === 'swap_request' ? 'bg-indigo-100 text-indigo-700' :
                     'bg-gray-100 text-gray-700'
                   }`}>
                     {notification.type === 'success' ? '✓' :
                      notification.type === 'error' ? '✗' :
                      notification.type === 'warning' ? '⚠' :
                      notification.type === 'shift' ? '🕐' :
                      notification.type === 'time_off_request' ? '📅' :
                      notification.type === 'swap_request' ? '🔄' :
                      'ℹ'}
                   </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                                         <div className="flex items-center justify-between mb-3">
                       <p className={`text-base font-semibold ${
                         !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                       }`}>
                         {notification.title || 'Notification'}
                       </p>
                       {!notification.isRead && (
                         <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                       )}
                     </div>
                     <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">
                       {notification.message}
                     </p>
                                         <div className="flex items-center gap-4 mt-4">
                                             <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full font-semibold border border-gray-200">
                         {notification.type?.replace('_', ' ').toUpperCase() || 'INFO'}
                       </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                                             {notification.actionUrl && (
                         <span className="text-xs text-blue-600 font-semibold ml-auto bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                           {notification.actionText || 'View Details'} →
                         </span>
                       )}
                    </div>
                  </div>

                                     {/* Mark as Read Button (for unread notifications) */}
                   {!notification.isRead && (
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         onMarkAsRead(notification.id);
                       }}
                       className="flex-shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
                       title="Mark as read"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

             {/* Footer */}
       {filteredNotifications.length > 0 && (
         <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              {activeTab === 'unread' && ` • ${unreadCount} unread`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
