/**
 * PayrollRecord Model
 * Represents payroll calculations and records for employees
 */
export class PayrollRecord {
  constructor(data = {}) {
    this.id = data.id || null;
    this.employeeId = data.employeeId || null;
    this.employeeName = data.employeeName || '';
    this.payPeriodStart = data.payPeriodStart || '';
    this.payPeriodEnd = data.payPeriodEnd || '';
    this.totalHours = data.totalHours || 0;
    this.regularHours = data.regularHours || 0;
    this.overtimeHours = data.overtimeHours || 0;
    this.hourlyRate = data.hourlyRate || 0;
    this.overtimeRate = data.overtimeRate || 0;
    this.regularPay = data.regularPay || 0;
    this.overtimePay = data.overtimePay || 0;
    this.totalPay = data.totalPay || 0;
    this.taxes = data.taxes || 0;
    this.deductions = data.deductions || 0;
    this.netPay = data.netPay || 0;
    this.status = data.status || 'pending'; // pending, processed, paid, cancelled
    this.paymentMethod = data.paymentMethod || 'direct_deposit'; // direct_deposit, check, cash
    this.paymentDate = data.paymentDate || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.processedBy = data.processedBy || null;
    this.processedAt = data.processedAt || null;
    this.notes = data.notes || '';
    this.shifts = data.shifts || []; // Array of shift IDs or shift objects
  }

  // Validation methods
  isValid() {
    return this.employeeId && this.payPeriodStart && this.payPeriodEnd && this.hourlyRate;
  }

  // Calculate payroll from shifts
  calculateFromShifts(shifts = []) {
    this.shifts = shifts;
    this.totalHours = 0;
    this.regularHours = 0;
    this.overtimeHours = 0;

    shifts.forEach(shift => {
      const duration = shift.getActualDuration() || shift.getDuration();
      this.totalHours += duration;
      
      if (duration <= 8) {
        this.regularHours += duration;
      } else {
        this.regularHours += 8;
        this.overtimeHours += (duration - 8);
      }
    });

    this.calculatePay();
  }

  // Calculate pay amounts
  calculatePay() {
    this.regularPay = this.regularHours * this.hourlyRate;
    this.overtimeRate = this.hourlyRate * 1.5; // Standard overtime rate
    this.overtimePay = this.overtimeHours * this.overtimeRate;
    this.totalPay = this.regularPay + this.overtimePay;
    
    // Calculate taxes (simplified - 15% for demo)
    this.taxes = this.totalPay * 0.15;
    
    // Calculate net pay
    this.netPay = this.totalPay - this.taxes - this.deductions;
  }

  // Process the payroll record
  process(processedBy, notes = '') {
    this.status = 'processed';
    this.processedBy = processedBy;
    this.processedAt = new Date().toISOString();
    this.notes = notes;
    this.updatedAt = new Date().toISOString();
  }

  // Mark as paid
  markAsPaid(paymentDate = null) {
    this.status = 'paid';
    this.paymentDate = paymentDate || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Cancel the payroll record
  cancel() {
    this.status = 'cancelled';
    this.updatedAt = new Date().toISOString();
  }

  // Check if record is pending
  isPending() {
    return this.status === 'pending';
  }

  // Check if record is processed
  isProcessed() {
    return this.status === 'processed';
  }

  // Check if record is paid
  isPaid() {
    return this.status === 'paid';
  }

  // Check if record is cancelled
  isCancelled() {
    return this.status === 'cancelled';
  }

  // Get status color for UI
  getStatusColor() {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processed': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[this.status] || colors.pending;
  }

  // Get pay period duration in days
  getPayPeriodDuration() {
    const start = new Date(this.payPeriodStart);
    const end = new Date(this.payPeriodEnd);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  }

  // Get average daily hours
  getAverageDailyHours() {
    const duration = this.getPayPeriodDuration();
    return duration > 0 ? this.totalHours / duration : 0;
  }

  // Get average hourly rate (including overtime)
  getAverageHourlyRate() {
    return this.totalHours > 0 ? this.totalPay / this.totalHours : 0;
  }

  // Check if employee worked overtime
  hasOvertime() {
    return this.overtimeHours > 0;
  }

  // Get overtime percentage
  getOvertimePercentage() {
    return this.totalHours > 0 ? (this.overtimeHours / this.totalHours) * 100 : 0;
  }

  // Convert to plain object for API calls
  toJSON() {
    return {
      id: this.id,
      employeeId: this.employeeId,
      employeeName: this.employeeName,
      payPeriodStart: this.payPeriodStart,
      payPeriodEnd: this.payPeriodEnd,
      totalHours: this.totalHours,
      regularHours: this.regularHours,
      overtimeHours: this.overtimeHours,
      hourlyRate: this.hourlyRate,
      overtimeRate: this.overtimeRate,
      regularPay: this.regularPay,
      overtimePay: this.overtimePay,
      totalPay: this.totalPay,
      taxes: this.taxes,
      deductions: this.deductions,
      netPay: this.netPay,
      status: this.status,
      paymentMethod: this.paymentMethod,
      paymentDate: this.paymentDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      processedBy: this.processedBy,
      processedAt: this.processedAt,
      notes: this.notes,
      shifts: this.shifts
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new PayrollRecord(data);
  }

  // Static method to get available statuses
  static getAvailableStatuses() {
    return ['pending', 'processed', 'paid', 'cancelled'];
  }

  // Static method to get available payment methods
  static getAvailablePaymentMethods() {
    return ['direct_deposit', 'check', 'cash'];
  }
}
