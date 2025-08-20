/**
 * TimeOffRequest Model
 * Represents time off requests from employees
 */
export class TimeOffRequest {
  constructor(data = {}) {
    this.id = data.id || null;
    this.employeeId = data.employeeId || null;
    this.employeeName = data.employeeName || '';
    this.startDate = data.startDate || '';
    this.endDate = data.endDate || '';
    this.reason = data.reason || '';
    this.type = data.type || 'vacation'; // vacation, sick, personal, bereavement, other
    this.status = data.status || 'pending'; // pending, approved, rejected, cancelled
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.reviewedBy = data.reviewedBy || null;
    this.reviewedAt = data.reviewedAt || null;
    this.reviewNotes = data.reviewNotes || '';
    this.emergency = data.emergency || false;
    this.documentation = data.documentation || null; // URL or reference to uploaded document
  }

  // Validation methods
  isValid() {
    return this.employeeId && this.startDate && this.endDate && this.reason;
  }

  // Check if request is pending
  isPending() {
    return this.status === 'pending';
  }

  // Check if request is approved
  isApproved() {
    return this.status === 'approved';
  }

  // Check if request is rejected
  isRejected() {
    return this.status === 'rejected';
  }

  // Check if request is cancelled
  isCancelled() {
    return this.status === 'cancelled';
  }

  // Approve the time off request
  approve(reviewedBy, reviewNotes = '') {
    this.status = 'approved';
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date().toISOString();
    this.reviewNotes = reviewNotes;
    this.updatedAt = new Date().toISOString();
  }

  // Reject the time off request
  reject(reviewedBy, reviewNotes = '') {
    this.status = 'rejected';
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date().toISOString();
    this.reviewNotes = reviewNotes;
    this.updatedAt = new Date().toISOString();
  }

  // Cancel the time off request
  cancel() {
    this.status = 'cancelled';
    this.updatedAt = new Date().toISOString();
  }

  // Calculate duration in days
  getDurationInDays() {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  }

  // Check if request is in the past
  isPast() {
    const today = new Date();
    const endDate = new Date(this.endDate);
    return endDate < today;
  }

  // Check if request is currently active
  isActive() {
    const today = new Date();
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    return today >= startDate && today <= endDate;
  }

  // Check if request is in the future
  isFuture() {
    const today = new Date();
    const startDate = new Date(this.startDate);
    return startDate > today;
  }

  // Check if request overlaps with another time off request
  overlapsWith(otherRequest) {
    if (this.employeeId !== otherRequest.employeeId) return false;
    
    const thisStart = new Date(this.startDate);
    const thisEnd = new Date(this.endDate);
    const otherStart = new Date(otherRequest.startDate);
    const otherEnd = new Date(otherRequest.endDate);
    
    return (thisStart <= otherEnd && thisEnd >= otherStart);
  }

  // Get status color for UI
  getStatusColor() {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[this.status] || colors.pending;
  }

  // Get type color for UI
  getTypeColor() {
    const colors = {
      'vacation': 'bg-blue-100 text-blue-800',
      'sick': 'bg-red-100 text-red-800',
      'personal': 'bg-purple-100 text-purple-800',
      'bereavement': 'bg-gray-100 text-gray-800',
      'other': 'bg-orange-100 text-orange-800'
    };
    return colors[this.type] || colors.other;
  }

  // Check if request needs attention (pending for more than 5 days)
  needsAttention() {
    return this.isPending() && this.getAgeInDays() > 5;
  }

  // Get request age in days
  getAgeInDays() {
    const requestDate = new Date(this.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - requestDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Convert to plain object for API calls
  toJSON() {
    return {
      id: this.id,
      employeeId: this.employeeId,
      employeeName: this.employeeName,
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason,
      type: this.type,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      reviewedBy: this.reviewedBy,
      reviewedAt: this.reviewedAt,
      reviewNotes: this.reviewNotes,
      emergency: this.emergency,
      documentation: this.documentation
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new TimeOffRequest(data);
  }

  // Static method to get available types
  static getAvailableTypes() {
    return ['vacation', 'sick', 'personal', 'bereavement', 'other'];
  }

  // Static method to get available statuses
  static getAvailableStatuses() {
    return ['pending', 'approved', 'rejected', 'cancelled'];
  }
}
