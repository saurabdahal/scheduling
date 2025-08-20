/**
 * User Model
 * Represents authentication and user management data
 */
export class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || '';
    this.password = data.password || '';
    this.role = data.role || 'Employee'; // Employee, Supervisor, Manager, Admin
    this.email = data.email || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.lastLogin = data.lastLogin || null;
    this.permissions = data.permissions || [];
  }

  // Validation methods
  isValid() {
    return this.username && this.password && this.role;
  }

  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  isAdmin() {
    return this.role === 'Admin';
  }

  isManager() {
    return this.role === 'Manager' || this.role === 'Admin';
  }

  isSupervisor() {
    return this.role === 'Supervisor' || this.role === 'Manager' || this.role === 'Admin';
  }

  // Static methods for role hierarchy
  static getAvailableRoles(userRole) {
    const roleHierarchy = {
      'Admin': ['Employee', 'Supervisor', 'Manager', 'Admin'],
      'Manager': ['Employee', 'Supervisor'],
      'Supervisor': ['Employee'],
      'Employee': ['Employee']
    };
    return roleHierarchy[userRole] || ['Employee'];
  }

  // Convert to plain object for API calls
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      password: this.password,
      role: this.role,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
      permissions: this.permissions
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new User(data);
  }
}
