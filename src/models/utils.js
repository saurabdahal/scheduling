/**
 * Model Utilities
 * Helper functions for working with models
 */

import { User } from './User.js';
import { Employee } from './Employee.js';
import { Shift } from './Shift.js';
import { SwapRequest } from './SwapRequest.js';
import { TimeOffRequest } from './TimeOffRequest.js';
import { PayrollRecord } from './PayrollRecord.js';
import { Availability } from './Availability.js';
import { Department } from './Department.js';
import { Notification } from './Notification.js';

/**
 * Convert plain objects to model instances
 */
export const createModelsFromData = {
  user: (data) => new User(data),
  employee: (data) => new Employee(data),
  shift: (data) => new Shift(data),
  swapRequest: (data) => new SwapRequest(data),
  timeOffRequest: (data) => new TimeOffRequest(data),
  payrollRecord: (data) => new PayrollRecord(data),
  availability: (data) => new Availability(data),
  department: (data) => new Department(data),
  notification: (data) => new Notification(data)
};

/**
 * Convert arrays of plain objects to model instances
 */
export const createModelArraysFromData = {
  users: (dataArray) => dataArray.map(data => new User(data)),
  employees: (dataArray) => dataArray.map(data => new Employee(data)),
  shifts: (dataArray) => dataArray.map(data => new Shift(data)),
  swapRequests: (dataArray) => dataArray.map(data => new SwapRequest(data)),
  timeOffRequests: (dataArray) => dataArray.map(data => new TimeOffRequest(data)),
  payrollRecords: (dataArray) => dataArray.map(data => new PayrollRecord(data)),
  departments: (dataArray) => dataArray.map(data => new Department(data)),
  notifications: (dataArray) => dataArray.map(data => new Notification(data))
};

/**
 * Convert model instances to plain objects for storage/API
 */
export const convertModelsToJSON = {
  user: (user) => user.toJSON(),
  employee: (employee) => employee.toJSON(),
  shift: (shift) => shift.toJSON(),
  swapRequest: (request) => request.toJSON(),
  timeOffRequest: (request) => request.toJSON(),
  payrollRecord: (record) => record.toJSON(),
  availability: (availability) => availability.toJSON(),
  department: (department) => department.toJSON(),
  notification: (notification) => notification.toJSON()
};

/**
 * Convert arrays of model instances to plain objects
 */
export const convertModelArraysToJSON = {
  users: (users) => users.map(user => user.toJSON()),
  employees: (employees) => employees.map(employee => employee.toJSON()),
  shifts: (shifts) => shifts.map(shift => shift.toJSON()),
  swapRequests: (requests) => requests.map(request => request.toJSON()),
  timeOffRequests: (requests) => requests.map(request => request.toJSON()),
  payrollRecords: (records) => records.map(record => record.toJSON()),
  departments: (departments) => departments.map(department => department.toJSON()),
  notifications: (notifications) => notifications.map(notification => notification.toJSON())
};

/**
 * Validation helpers
 */
export const validateModels = {
  user: (data) => new User(data).isValid(),
  employee: (data) => new Employee(data).isValid(),
  shift: (data) => new Shift(data).isValid(),
  swapRequest: (data) => new SwapRequest(data).isValid(),
  timeOffRequest: (data) => new TimeOffRequest(data).isValid(),
  payrollRecord: (data) => new PayrollRecord(data).isValid(),
  department: (data) => new Department(data).isValid(),
  notification: (data) => new Notification(data).isValid()
};

/**
 * Generate demo data using models
 */
export const generateDemoData = {
  // Generate demo employees - REMOVED: No more mock data
  employees: () => [],

  // Generate demo users - REMOVED: No more mock data  
  users: () => [],

  // Generate demo departments - REMOVED: No more mock data
  departments: () => []
};

/**
 * Helper to find model by ID
 */
export const findModelById = (models, id) => {
  return models.find(model => model.id === id);
};

/**
 * Helper to filter models by property
 */
export const filterModelsByProperty = (models, property, value) => {
  return models.filter(model => model[property] === value);
};

/**
 * Helper to sort models by property
 */
export const sortModelsByProperty = (models, property, ascending = true) => {
  return [...models].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (ascending) {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

/**
 * Helper to group models by property
 */
export const groupModelsByProperty = (models, property) => {
  return models.reduce((groups, model) => {
    const key = model[property];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(model);
    return groups;
  }, {});
};

/**
 * Utility function to populate employee names from employee IDs
 * This fixes the "Unknown Employee" issue by looking up employee names
 * @param {Array} records - Array of records (shifts, time off requests, etc.)
 * @param {Array} employees - Array of employee objects
 * @returns {Array} - Updated records with proper employee names
 */
export function populateEmployeeNames(records, employees) {
  if (!records || !employees) return records;
  
  return records.map(record => {
    // Handle records with employeeId/employeeName (shifts, time off requests, payroll)
    if (record.employeeId && !record.employeeName) {
      const employee = employees.find(emp => emp.id === record.employeeId);
      if (employee) {
        return { ...record, employeeName: employee.name };
      }
    }
    
    // Handle records with requesterId/requesterName (swap requests)
    if (record.requesterId && !record.requesterName) {
      const employee = employees.find(emp => emp.id === record.requesterId);
      if (employee) {
        return { ...record, requesterName: employee.name };
      }
    }
    
    return record;
  });
}

/**
 * Utility function to get employee name by ID
 * @param {number} employeeId - The employee ID to look up
 * @param {Array} employees - Array of employee objects
 * @returns {string} - Employee name or "Unknown Employee" if not found
 */
export function getEmployeeName(employeeId, employees) {
  if (!employeeId || !employees) return "Unknown Employee";
  
  const employee = employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : "Unknown Employee";
}

/**
 * Utility function to get employee by ID
 * @param {number} employeeId - The employee ID to look up
 * @param {Array} employees - Array of employee objects
 * @returns {Object|null} - Employee object or null if not found
 */
export function getEmployeeById(employeeId, employees) {
  if (!employeeId || !employees) return null;
  
  return employees.find(emp => emp.id === employeeId) || null;
}

/**
 * Fix existing data that has "Unknown" employee names
 * This function should be called when the app loads to fix any existing data issues
 * @param {Array} records - Array of records (shifts, time off requests, etc.)
 * @param {Array} employees - Array of employee objects
 * @returns {Array} - Updated records with proper employee names
 */
export function fixUnknownEmployeeNames(records, employees) {
  if (!records || !employees) return records;
  
  return records.map(record => {
    // Handle records with employeeId/employeeName (shifts, time off requests, payroll)
    if (record.employeeId && (record.employeeName === 'Unknown' || !record.employeeName)) {
      const employee = employees.find(emp => emp.id === record.employeeId);
      if (employee) {
        return { ...record, employeeName: employee.name };
      }
    }
    
    // Handle records with requesterId/requesterName (swap requests)
    if (record.requesterId && (record.requesterName === 'Unknown' || !record.requesterName)) {
      const employee = employees.find(emp => emp.id === record.requesterId);
      if (employee && employee.name) {
        return { ...record, requesterName: employee.name };
      }
    }
    
    return record;
  });
}

/**
 * Link users to employees by email to establish proper relationships
 * This function should be called when the app loads to fix any existing data issues
 * @param {Array} users - Array of user objects
 * @param {Array} employees - Array of employee objects
 * @returns {Array} - Updated employees with proper userId links
 */
export function linkUsersToEmployees(users, employees) {
  if (!users || !employees) return employees;
  
  return employees.map(employee => {
    // Try to find a user with matching email
    const matchingUser = users.find(user => user.email === employee.email);
    if (matchingUser && !employee.userId) {
      return { ...employee, userId: matchingUser.id };
    }
    return employee;
  });
}

/**
 * Get employee name by user ID, linking through email if necessary
 * @param {number} userId - The user ID to look up
 * @param {Array} users - Array of user objects
 * @param {Array} employees - Array of employee objects
 * @returns {string} - Employee name or "Unknown Employee" if not found
 */
export function getEmployeeNameByUserId(userId, users, employees) {
  if (!userId || !users || !employees) {
    return "Unknown Employee";
  }
  
  // First try to find employee directly by userId
  let employee = employees.find(emp => emp.userId === userId);
  
  // If not found, try to find by linking through email
  if (!employee) {
    const user = users.find(u => u.id === userId);
    
    if (user && user.email) {
      employee = employees.find(emp => emp.email === user.email);
    }
  }
  
  return employee ? employee.name : "Unknown Employee";
}

/**
 * Get employee name by user email
 * @param {string} userEmail - User email
 * @param {Array} employees - Array of employee objects
 * @returns {string} - Employee name or fallback
 */
export function getEmployeeNameByEmail(userEmail, employees) {
  if (!userEmail || !employees) return null;
  
  const employee = employees.find(emp => emp.email === userEmail);
  return employee ? employee.name : null;
}
