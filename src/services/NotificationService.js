import { Notification } from '../models/index.js';
import dataService from './DataService.js';

class NotificationService {
  constructor() {
    this.notifications = [];
  }

  // Create a new notification
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      
      if (!notification.isValid()) {
        throw new Error('Invalid notification data');
      }

      // Save to database
      const savedNotification = await dataService.saveNotification(notification);
      
      // Add to local state
      this.notifications.push(savedNotification);
      
      return savedNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a specific user
  async getUserNotifications(userId, userRole) {
    try {
      const allNotifications = await dataService.getAll('notifications');
      
      // Filter notifications based on user role and recipient
      const userNotifications = allNotifications.filter(notification => {
        // Show notifications for all users
        if (notification.recipientType === 'all') return true;
        
        // Show notifications for specific user (check both userId and recipientId)
        if (notification.userId === userId || notification.recipientId === userId) return true;
        
        // Show notifications for specific role
        if (notification.recipientType === 'role' && notification.recipientRole === userRole) return true;
        
        return false;
      });

      return userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const allNotifications = await dataService.getAll('notifications');
      const notification = allNotifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
        await dataService.saveNotification(notification);
        
        // Update local state
        const localNotification = this.notifications.find(n => n.id === notificationId);
        if (localNotification) {
          localNotification.isRead = true;
          localNotification.readAt = notification.readAt;
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId, userRole) {
    try {
      const allNotifications = await dataService.getAll('notifications');
      
      // Get all notifications that should be marked as read for this user
      const userNotifications = allNotifications.filter(n => {
        // Direct user notifications
        const isDirectUserNotification = n.userId === userId || n.recipientId === userId;
        
        // Role-based notifications (for Admin/Manager)
        const isRoleBasedNotification = n.recipientRole && n.recipientRole === userRole;
        
        // General notifications for all users
        const isGeneralNotification = n.recipientType === 'all' || !n.recipientRole;
        
        // Admin/Manager specific notifications
        const isAdminManagerNotification = 
          (userRole === 'Admin' || userRole === 'Manager') &&
          (n.recipientRole === 'Admin' || n.recipientRole === 'Manager');
        
        return isDirectUserNotification || isRoleBasedNotification || isGeneralNotification || isAdminManagerNotification;
      });
      
      const updatedNotifications = userNotifications.map(n => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString()
      }));
      
      // Save all updated notifications
      for (const notification of updatedNotifications) {
        await dataService.saveNotification(notification);
      }
      
      // Update local state
      this.notifications = this.notifications.map(n => {
        const updated = updatedNotifications.find(un => un.id === n.id);
        return updated || n;
      });
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    try {
      const result = await dataService.delete('notifications', notificationId);
      
      if (result) {
        // Remove from local state
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Get unread notification count for a user
  async getUnreadCount(userId, userRole) {
    try {
      const notifications = await this.getUserNotifications(userId, userRole);
      return notifications.filter(n => !n.isRead).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Create shift-related notifications
  async createShiftNotification(type, shiftData, employeeData, additionalData = {}) {
    const notificationData = {
      id: Date.now(),
      type: type,
      title: this.getShiftNotificationTitle(type),
      message: this.getShiftNotificationMessage(type, shiftData, employeeData, additionalData),
      recipientId: employeeData.userId || employeeData.id,
      recipientType: 'user',
      priority: 'medium',
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        shiftId: shiftData.id,
        employeeId: employeeData.id,
        shiftDate: shiftData.date,
        ...additionalData
      }
    };

    return await this.createNotification(notificationData);
  }

  // Create system-wide notifications
  async createSystemNotification(type, title, message, priority = 'normal', additionalData = {}) {
    const notificationData = {
      id: Date.now(),
      type: type,
      title: title,
      message: message,
      recipientType: 'all',
      priority: priority,
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: additionalData
    };

    return await this.createNotification(notificationData);
  }

  // Create conflict detection notifications
  async createConflictNotification(conflictType, employeeName, date, time, priority = 'high') {
    const notificationData = {
      id: Date.now(),
      type: 'conflict',
      title: `${conflictType} Conflict Detected`,
      message: `${conflictType} conflict detected for ${employeeName} on ${date} at ${time}`,
      recipientRole: 'Manager',
      priority: priority,
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        conflictType,
        employeeName,
        date,
        time
      }
    };

    return await this.createNotification(notificationData);
  }

  // Create request-related notifications
  async createRequestNotification(type, requestData, employeeData, additionalData = {}) {
    const notificationData = {
      id: Date.now(),
      type: type,
      title: this.getRequestNotificationTitle(type),
      message: this.getRequestNotificationMessage(type, requestData, employeeData, additionalData),
      recipientId: employeeData.userId || employeeData.id,
      recipientType: 'user',
      priority: 'medium',
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        requestId: requestData.id,
        employeeId: employeeData.id,
        ...additionalData
      }
    };

    return await this.createNotification(notificationData);
  }

  // Get notification title based on type
  getShiftNotificationTitle(type) {
    const titles = {
      'shift_created': 'New Shift Assigned',
      'shift_updated': 'Shift Updated',
      'shift_cancelled': 'Shift Cancelled',
      'shift_reminder': 'Shift Reminder',
      'shift_conflict': 'Shift Conflict Detected'
    };
    return titles[type] || 'Shift Notification';
  }

  // Get notification message based on type
  getShiftNotificationMessage(type, shiftData, employeeData, additionalData) {
    const baseMessage = `Shift on ${shiftData.date} from ${shiftData.startTime} to ${shiftData.endTime}`;
    
    switch (type) {
      case 'shift_created':
        return `You have been assigned a new shift: ${baseMessage}`;
      case 'shift_updated':
        return `Your shift has been updated: ${baseMessage}`;
      case 'shift_cancelled':
        return `Your shift has been cancelled: ${baseMessage}`;
      case 'shift_reminder':
        return `Reminder: You have a shift tomorrow: ${baseMessage}`;
      case 'shift_conflict':
        return `Shift conflict detected: ${baseMessage}`;
      default:
        return baseMessage;
    }
  }

  // Get request notification title based on type
  getRequestNotificationTitle(type) {
    const titles = {
      'swap_requested': 'Shift Swap Request',
      'swap_approved': 'Shift Swap Approved',
      'swap_rejected': 'Shift Swap Rejected',
      'timeoff_requested': 'Time Off Request',
      'timeoff_approved': 'Time Off Approved',
      'timeoff_rejected': 'Time Off Rejected'
    };
    return titles[type] || 'Request Notification';
  }

  // Get request notification message based on type
  getRequestNotificationMessage(type, requestData, employeeData, additionalData) {
    switch (type) {
      case 'swap_requested':
        return `Shift swap request submitted for ${requestData.shiftDate}`;
      case 'swap_approved':
        return `Your shift swap request has been approved`;
      case 'swap_rejected':
        return `Your shift swap request has been rejected`;
      case 'timeoff_requested':
        return `Time off request submitted for ${requestData.startDate} to ${requestData.endDate}`;
      case 'timeoff_approved':
        return `Your time off request has been approved`;
      case 'timeoff_rejected':
        return `Your time off request has been rejected`;
      default:
        return 'Request notification';
    }
  }

  // Create manager/admin notifications for pending requests
  async createManagerNotification(type, requestData, employeeData) {
    const notificationData = {
      id: Date.now(),
      type: type,
      title: this.getManagerNotificationTitle(type),
      message: this.getManagerNotificationMessage(type, requestData, employeeData),
      recipientType: 'role',
      recipientRole: 'Manager',
      priority: 'medium',
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        requestId: requestData.id,
        employeeId: employeeData.id,
        employeeName: employeeData.name
      }
    };

    return await this.createNotification(notificationData);
  }

  // Get manager notification title
  getManagerNotificationTitle(type) {
    const titles = {
      'swap_pending': 'Pending Shift Swap Request',
      'timeoff_pending': 'Pending Time Off Request'
    };
    return titles[type] || 'Manager Notification';
  }

  // Get manager notification message
  getManagerNotificationMessage(type, requestData, employeeData) {
    switch (type) {
      case 'swap_pending':
        return `${employeeData.name} has requested a shift swap for ${requestData.shiftDate}`;
      case 'timeoff_pending':
        return `${employeeData.name} has requested time off from ${requestData.startDate} to ${requestData.endDate}`;
      default:
        return 'Manager notification';
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService;
