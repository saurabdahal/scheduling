/**
 * Notification Model
 * Represents system notifications and alerts
 */
export class Notification {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.type = data.type || 'info'; // success, error, warning, info
    this.title = data.title || '';
    this.message = data.message || '';
    this.userId = data.userId || null; // Target user for the notification
    this.recipientRole = data.recipientRole || null; // Target role for the notification
    this.isRead = data.isRead !== undefined ? data.isRead : false;
    this.isDismissed = data.isDismissed !== undefined ? data.isDismissed : false;
    this.priority = data.priority || 'normal'; // low, normal, high, urgent
    this.category = data.category || 'general'; // general, shift, payroll, timeoff, swap
    this.actionUrl = data.actionUrl || null; // URL to navigate to when clicked
    this.actionText = data.actionText || null; // Text for action button
    this.createdAt = data.createdAt || new Date().toISOString();
    this.readAt = data.readAt || null;
    this.dismissedAt = data.dismissedAt || null;
    this.expiresAt = data.expiresAt || null; // Auto-expire notification
    this.metadata = data.metadata || {}; // Additional data
  }

  // Validation methods
  isValid() {
    return this.type && this.message;
  }

  // Check if notification is unread
  isUnread() {
    return !this.isRead;
  }

  // Check if notification is dismissed
  isDismissed() {
    return this.isDismissed;
  }

  // Check if notification is expired
  isExpired() {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  }

  // Check if notification is actionable
  isActionable() {
    return !!(this.actionUrl || this.actionText);
  }

  // Mark notification as read
  markAsRead() {
    this.isRead = true;
    this.readAt = new Date().toISOString();
  }

  // Mark notification as unread
  markAsUnread() {
    this.isRead = false;
    this.readAt = null;
  }

  // Dismiss notification
  dismiss() {
    this.isDismissed = true;
    this.dismissedAt = new Date().toISOString();
  }

  // Get type color for UI
  getTypeColor() {
    const colors = {
      'success': 'bg-green-100 text-green-800 border-green-200',
      'error': 'bg-red-100 text-red-800 border-red-200',
      'warning': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'info': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[this.type] || colors.info;
  }

  // Get priority color for UI
  getPriorityColor() {
    const colors = {
      'low': 'bg-gray-100 text-gray-800',
      'normal': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[this.priority] || colors.normal;
  }

  // Get icon for notification type
  getIcon() {
    const icons = {
      'success': '✓',
      'error': '✗',
      'warning': '⚠',
      'info': 'ℹ'
    };
    return icons[this.type] || icons.info;
  }

  // Get age in minutes
  getAgeInMinutes() {
    const created = new Date(this.createdAt);
    const now = new Date();
    const diffMs = now - created;
    return Math.floor(diffMs / (1000 * 60));
  }

  // Get age in hours
  getAgeInHours() {
    return Math.floor(this.getAgeInMinutes() / 60);
  }

  // Get age in days
  getAgeInDays() {
    return Math.floor(this.getAgeInHours() / 24);
  }

  // Get formatted age string
  getFormattedAge() {
    const minutes = this.getAgeInMinutes();
    const hours = this.getAgeInHours();
    const days = this.getAgeInDays();

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  // Check if notification should be shown
  shouldShow() {
    return !this.isDismissed && !this.isExpired();
  }

  // Convert to plain object for API calls
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      message: this.message,
      userId: this.userId,
      recipientRole: this.recipientRole,
      isRead: this.isRead,
      isDismissed: this.isDismissed,
      priority: this.priority,
      category: this.category,
      actionUrl: this.actionUrl,
      actionText: this.actionText,
      createdAt: this.createdAt,
      readAt: this.readAt,
      dismissedAt: this.dismissedAt,
      expiresAt: this.expiresAt,
      metadata: this.metadata
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new Notification(data);
  }

  // Static methods for creating common notifications
  static createShiftConflict(employeeName, date, time) {
    return new Notification({
      type: 'warning',
      title: 'Shift Conflict Detected',
      message: `Overlapping shifts detected for ${employeeName} on ${date} at ${time}`,
      category: 'shift',
      priority: 'high',
      actionUrl: '/shifts',
      actionText: 'View Shifts'
    });
  }

  static createTimeOffRequest(employeeName, startDate, endDate) {
    return new Notification({
      type: 'info',
      title: 'Time Off Request',
      message: `${employeeName} has requested time off from ${startDate} to ${endDate}`,
      category: 'timeoff',
      priority: 'normal',
      actionUrl: '/swap-shift',
      actionText: 'Review Request'
    });
  }

  static createSwapRequest(employeeName, shiftDate) {
    return new Notification({
      type: 'info',
      title: 'Shift Swap Request',
      message: `${employeeName} has requested a shift swap for ${shiftDate}`,
      category: 'swap',
      priority: 'normal',
      actionUrl: '/swap-shift',
      actionText: 'Review Request'
    });
  }

  static createPayrollReady(employeeName, payPeriod) {
    return new Notification({
      type: 'success',
      title: 'Payroll Ready',
      message: `Payroll for ${employeeName} is ready for ${payPeriod}`,
      category: 'payroll',
      priority: 'normal',
      actionUrl: '/payroll',
      actionText: 'View Payroll'
    });
  }

  // Static method to get available types
  static getAvailableTypes() {
    return ['success', 'error', 'warning', 'info'];
  }

  // Static method to get available priorities
  static getAvailablePriorities() {
    return ['low', 'normal', 'high', 'urgent'];
  }

  // Static method to get available categories
  static getAvailableCategories() {
    return ['general', 'shift', 'payroll', 'timeoff', 'swap'];
  }
}
