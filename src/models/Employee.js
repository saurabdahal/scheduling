import { Availability } from './Availability.js';

/**
 * Employee Model
 * Represents employee data including personal info, work details, and availability
 */
export class Employee {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.emergencyContact = data.emergencyContact || '';
    this.emergencyPhone = data.emergencyPhone || '';
    this.role = data.role || 'Employee';
    this.hourlyRate = data.hourlyRate || 0;
    this.departments = data.departments || data.skills || [];
    this.availability = data.availability ? new Availability(data.availability) : new Availability();
    this.status = data.status || 'active'; // active, inactive, terminated
    this.hireDate = data.hireDate || new Date().toISOString().split('T')[0];
    this.terminationDate = data.terminationDate || null;
    this.userId = data.userId || null; // Reference to User model
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Validation methods
  isValid() {
    return this.name && this.email && this.role;
  }

  isActive() {
    return this.status === 'active';
  }

  // Get full name
  getFullName() {
    return this.name;
  }

  // Check if employee can work on specific day and time
  canWorkOn(dayOfWeek, startTime, endTime) {
    return this.availability.canWorkOn(dayOfWeek, startTime, endTime);
  }

  // Get primary department
  getPrimaryDepartment() {
    return this.departments.length > 0 ? this.departments[0] : null;
  }

  // Check if employee has skill/department
  hasDepartment(department) {
    return this.departments.includes(department);
  }

  // Add department/skill
  addDepartment(department) {
    if (!this.departments.includes(department)) {
      this.departments.push(department);
    }
  }

  // Remove department/skill
  removeDepartment(department) {
    this.departments = this.departments.filter(d => d !== department);
  }

  // Calculate weekly availability hours
  getWeeklyAvailabilityHours() {
    return this.availability.getWeeklyHours();
  }

  // Convert to plain object for API calls
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      emergencyContact: this.emergencyContact,
      emergencyPhone: this.emergencyPhone,
      role: this.role,
      hourlyRate: this.hourlyRate,
      departments: this.departments,
      availability: this.availability.toJSON(),
      status: this.status,
      hireDate: this.hireDate,
      terminationDate: this.terminationDate,
      userId: this.userId,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new Employee(data);
  }

  // Static method to get available departments
  static getAvailableDepartments() {
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
