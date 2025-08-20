/**
 * Shift Model
 * Represents work shifts including scheduling, timing, and status information
 */
export class Shift {
  constructor(data = {}) {
    this.id = data.id || null;
    this.employeeId = data.employeeId || null;
    this.employeeName = data.employeeName || '';
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.startTime = data.startTime || '09:00';
    this.endTime = data.endTime || '17:00';
    this.actualStartTime = data.actualStartTime || null;
    this.actualEndTime = data.actualEndTime || null;
    this.role = data.role || 'cashier';
    this.status = data.status || 'scheduled'; // scheduled, in-progress, completed, cancelled
    this.notes = data.notes || '';
    this.hourlyRate = data.hourlyRate || 0;
    this.breakTime = data.breakTime || 0; // minutes
    this.overtime = data.overtime || 0; // minutes
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null;
    this.approvedBy = data.approvedBy || null;
    this.approvedAt = data.approvedAt || null;
  }

  // Validation methods
  isValid() {
    return this.employeeId && this.date && this.startTime && this.endTime;
  }

  // Check if shift is in the past
  isPast() {
    const today = new Date();
    const shiftDate = new Date(this.date);
    return shiftDate < today;
  }

  // Check if shift is today
  isToday() {
    const today = new Date();
    const shiftDate = new Date(this.date);
    return shiftDate.toDateString() === today.toDateString();
  }

  // Check if shift is in the future
  isFuture() {
    const today = new Date();
    const shiftDate = new Date(this.date);
    return shiftDate > today;
  }

  // Check if shift is currently in progress
  isInProgress() {
    if (!this.isToday()) return false;
    
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    return this.startTime <= currentTime && this.endTime >= currentTime;
  }

  // Calculate shift duration in hours
  getDuration() {
    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);
    return (endMinutes - startMinutes) / 60;
  }

  // Calculate actual duration if actual times are recorded
  getActualDuration() {
    if (!this.actualStartTime || !this.actualEndTime) return null;
    
    const startMinutes = this.timeToMinutes(this.actualStartTime);
    const endMinutes = this.timeToMinutes(this.actualEndTime);
    return (endMinutes - startMinutes) / 60;
  }

  // Calculate total pay for this shift
  getTotalPay() {
    const duration = this.getActualDuration() || this.getDuration();
    return duration * this.hourlyRate;
  }

  // Check if shift has overtime
  hasOvertime() {
    const duration = this.getActualDuration() || this.getDuration();
    return duration > 8; // Assuming 8 hours is standard work day
  }

  // Get overtime hours
  getOvertimeHours() {
    const duration = this.getActualDuration() || this.getDuration();
    return Math.max(0, duration - 8);
  }

  // Convert time string to minutes
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Check if shift overlaps with another shift
  overlapsWith(otherShift) {
    if (this.date !== otherShift.date) return false;
    if (this.employeeId !== otherShift.employeeId) return false;
    
    const thisStart = this.timeToMinutes(this.startTime);
    const thisEnd = this.timeToMinutes(this.endTime);
    const otherStart = this.timeToMinutes(otherShift.startTime);
    const otherEnd = this.timeToMinutes(otherShift.endTime);
    
    return (thisStart < otherEnd && thisEnd > otherStart);
  }

  // Start the shift (record actual start time)
  start() {
    if (this.status !== 'scheduled') {
      throw new Error('Shift must be scheduled to start');
    }
    
    this.actualStartTime = new Date().toTimeString().slice(0, 5);
    this.status = 'in-progress';
    this.updatedAt = new Date().toISOString();
  }

  // End the shift (record actual end time)
  end() {
    if (this.status !== 'in-progress') {
      throw new Error('Shift must be in progress to end');
    }
    
    this.actualEndTime = new Date().toTimeString().slice(0, 5);
    this.status = 'completed';
    this.updatedAt = new Date().toISOString();
  }

  // Cancel the shift
  cancel() {
    this.status = 'cancelled';
    this.updatedAt = new Date().toISOString();
  }

  // Get status color for UI
  getStatusColor() {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[this.status] || colors.scheduled;
  }

  // Convert to plain object for API calls
  toJSON() {
    return {
      id: this.id,
      employeeId: this.employeeId,
      employeeName: this.employeeName,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      actualStartTime: this.actualStartTime,
      actualEndTime: this.actualEndTime,
      role: this.role,
      status: this.status,
      notes: this.notes,
      hourlyRate: this.hourlyRate,
      breakTime: this.breakTime,
      overtime: this.overtime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new Shift(data);
  }

  // Static method to get available roles
  static getAvailableRoles() {
    return [
      'cashier',
      'barista',
      'kitchen',
      'cleaning',
      'customer-service',
      'inventory',
      'food-prep',
      'coffee-making',
      'baking',
      'management'
    ];
  }
}
