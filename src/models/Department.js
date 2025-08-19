/**
 * Department Model
 * Represents departments/roles in the organization
 */
export class Department {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.code = data.code || '';
    this.description = data.description || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.managerId = data.managerId || null;
    this.managerName = data.managerName || '';
    this.requiredSkills = data.requiredSkills || [];
    this.minimumStaffing = data.minimumStaffing || 1;
    this.maximumStaffing = data.maximumStaffing || 10;
    this.hourlyRate = data.hourlyRate || 0; // Default hourly rate for this department
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.color = data.color || '#3B82F6'; // Default color for UI
  }

  // Validation methods
  isValid() {
    return this.name && this.code;
  }

  // Check if department is active
  isActive() {
    return this.isActive;
  }

  // Get display name
  getDisplayName() {
    return this.name;
  }

  // Get formatted code
  getFormattedCode() {
    return this.code.toUpperCase();
  }

  // Check if employee has required skills for this department
  hasRequiredSkills(employeeSkills = []) {
    if (this.requiredSkills.length === 0) return true;
    return this.requiredSkills.some(skill => employeeSkills.includes(skill));
  }

  // Get missing skills for an employee
  getMissingSkills(employeeSkills = []) {
    return this.requiredSkills.filter(skill => !employeeSkills.includes(skill));
  }

  // Check if department is understaffed
  isUnderstaffed(currentStaffCount) {
    return currentStaffCount < this.minimumStaffing;
  }

  // Check if department is overstaffed
  isOverstaffed(currentStaffCount) {
    return currentStaffCount > this.maximumStaffing;
  }

  // Get staffing status
  getStaffingStatus(currentStaffCount) {
    if (this.isUnderstaffed(currentStaffCount)) {
      return 'understaffed';
    } else if (this.isOverstaffed(currentStaffCount)) {
      return 'overstaffed';
    } else {
      return 'adequate';
    }
  }

  // Get staffing status color
  getStaffingStatusColor(currentStaffCount) {
    const status = this.getStaffingStatus(currentStaffCount);
    const colors = {
      'understaffed': 'bg-red-100 text-red-800',
      'overstaffed': 'bg-yellow-100 text-yellow-800',
      'adequate': 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.adequate;
  }

  // Convert to plain object for API calls
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      description: this.description,
      isActive: this.isActive,
      managerId: this.managerId,
      managerName: this.managerName,
      requiredSkills: this.requiredSkills,
      minimumStaffing: this.minimumStaffing,
      maximumStaffing: this.maximumStaffing,
      hourlyRate: this.hourlyRate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      color: this.color
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new Department(data);
  }

  // Static method to get available departments
  static getAvailableDepartments() {
    return [
      {
        name: 'Cashier',
        code: 'cashier',
        description: 'Handles customer transactions and cash register operations',
        requiredSkills: ['customer-service', 'cash-handling'],
        minimumStaffing: 2,
        maximumStaffing: 6,
        hourlyRate: 15.00,
        color: '#3B82F6'
      },
      {
        name: 'Barista',
        code: 'barista',
        description: 'Prepares coffee and other beverages',
        requiredSkills: ['coffee-making', 'customer-service'],
        minimumStaffing: 1,
        maximumStaffing: 4,
        hourlyRate: 16.00,
        color: '#8B5CF6'
      },
      {
        name: 'Kitchen',
        code: 'kitchen',
        description: 'Prepares food items and manages kitchen operations',
        requiredSkills: ['food-prep', 'kitchen-safety'],
        minimumStaffing: 1,
        maximumStaffing: 3,
        hourlyRate: 17.00,
        color: '#EF4444'
      },
      {
        name: 'Cleaning',
        code: 'cleaning',
        description: 'Maintains cleanliness and sanitation standards',
        requiredSkills: ['cleaning', 'sanitation'],
        minimumStaffing: 1,
        maximumStaffing: 2,
        hourlyRate: 14.00,
        color: '#10B981'
      },
      {
        name: 'Customer Service',
        code: 'customer-service',
        description: 'Provides customer support and handles inquiries',
        requiredSkills: ['customer-service', 'communication'],
        minimumStaffing: 1,
        maximumStaffing: 3,
        hourlyRate: 15.50,
        color: '#F59E0B'
      },
      {
        name: 'Inventory',
        code: 'inventory',
        description: 'Manages stock levels and inventory tracking',
        requiredSkills: ['inventory-management', 'organization'],
        minimumStaffing: 1,
        maximumStaffing: 2,
        hourlyRate: 16.50,
        color: '#6B7280'
      },
      {
        name: 'Food Prep',
        code: 'food-prep',
        description: 'Prepares ingredients and food items',
        requiredSkills: ['food-prep', 'food-safety'],
        minimumStaffing: 1,
        maximumStaffing: 2,
        hourlyRate: 15.50,
        color: '#DC2626'
      },
      {
        name: 'Coffee Making',
        code: 'coffee-making',
        description: 'Specializes in coffee preparation and brewing',
        requiredSkills: ['coffee-making', 'equipment-maintenance'],
        minimumStaffing: 1,
        maximumStaffing: 3,
        hourlyRate: 16.50,
        color: '#7C3AED'
      },
      {
        name: 'Baking',
        code: 'baking',
        description: 'Prepares baked goods and pastries',
        requiredSkills: ['baking', 'food-safety'],
        minimumStaffing: 1,
        maximumStaffing: 2,
        hourlyRate: 17.50,
        color: '#D97706'
      },
      {
        name: 'Management',
        code: 'management',
        description: 'Oversees operations and manages staff',
        requiredSkills: ['leadership', 'management'],
        minimumStaffing: 1,
        maximumStaffing: 2,
        hourlyRate: 20.00,
        color: '#059669'
      }
    ];
  }
}
