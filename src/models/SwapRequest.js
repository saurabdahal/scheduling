/**
 * SwapRequest Model
 * Represents shift swap requests between employees
 */
export class SwapRequest {
  constructor(data = {}) {
    this.id = data.id || null;
    this.requesterId = data.requesterId || null;
    this.requesterName = data.requesterName || '';
    this.shiftId = data.shiftId || null;
    this.shiftDate = data.shiftDate || '';
    this.shiftTime = data.shiftTime || '';
    this.reason = data.reason || '';
    this.status = data.status || 'pending'; // pending, approved, rejected, cancelled
    this.preferredSwapWith = data.preferredSwapWith || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.reviewedBy = data.reviewedBy || null;
    this.reviewedAt = data.reviewedAt || null;
    this.reviewNotes = data.reviewNotes || '';
    this.swapShiftId = data.swapShiftId || null; // The shift being swapped with
  }

  // Validation methods
  isValid() {
    return this.requesterId && this.shiftId && this.reason;
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

  // Approve the swap request
  approve(reviewedBy, reviewNotes = '') {
    this.status = 'approved';
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date().toISOString();
    this.reviewNotes = reviewNotes;
    this.updatedAt = new Date().toISOString();
  }

  // Reject the swap request
  reject(reviewedBy, reviewNotes = '') {
    this.status = 'rejected';
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date().toISOString();
    this.reviewNotes = reviewNotes;
    this.updatedAt = new Date().toISOString();
  }

  // Cancel the swap request
  cancel() {
    this.status = 'cancelled';
    this.updatedAt = new Date().toISOString();
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

  // Check if request is older than specified days
  isOlderThan(days) {
    const requestDate = new Date(this.createdAt);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return requestDate < cutoffDate;
  }

  // Get request age in days
  getAgeInDays() {
    const requestDate = new Date(this.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - requestDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Check if request needs attention (pending for more than 3 days)
  needsAttention() {
    return this.isPending() && this.getAgeInDays() > 3;
  }

  // Convert to plain object for API calls
  toJSON() {
    return {
      id: this.id,
      requesterId: this.requesterId,
      requesterName: this.requesterName,
      shiftId: this.shiftId,
      shiftDate: this.shiftDate,
      shiftTime: this.shiftTime,
      reason: this.reason,
      status: this.status,
      preferredSwapWith: this.preferredSwapWith,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      reviewedBy: this.reviewedBy,
      reviewedAt: this.reviewedAt,
      reviewNotes: this.reviewNotes,
      swapShiftId: this.swapShiftId
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new SwapRequest(data);
  }

  // Static method to get available statuses
  static getAvailableStatuses() {
    return ['pending', 'approved', 'rejected', 'cancelled'];
  }
}
