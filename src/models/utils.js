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
