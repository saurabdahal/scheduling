import { 
  User, 
  Employee, 
  Shift, 
  SwapRequest, 
  TimeOffRequest, 
  PayrollRecord, 
  Department, 
  Notification
} from '../models/index.js';

class DataService {
  constructor() {
    this.dataPath = 'http://localhost:3005/data';
    this.files = {
      users: 'users.json',
      employees: 'employees.json',
      shifts: 'shifts.json',
      swapRequests: 'swap-requests.json',
      timeOffRequests: 'time-off-requests.json',
      payrollRecords: 'payroll-records.json',
      departments: 'departments.json',
      notifications: 'notifications.json'
    };
    // Server is responsible for initializing base data
  }

  // Client no longer seeds demo data

  // Check if a file exists
  async fileExists(filename) {
    try {
      const response = await fetch(`${this.dataPath}/${filename}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Load data from JSON file
  async loadData(dataType) {
    try {
      const filename = this.files[dataType];
      if (!filename) {
        throw new Error(`Unknown data type: ${dataType}`);
      }

      const response = await fetch(`${this.dataPath}/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.statusText}`);
      }

      // Ensure response is JSON, not an HTML error page
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON for ${filename} but received: ${text.slice(0, 60)}...`);
      }

      const jsonData = await response.json();
      
      // Convert JSON data back to model instances
      return this.convertToModels(dataType, jsonData);
    } catch (error) {
      console.error(`Error loading ${dataType}:`, error);
      return [];
    }
  }

  // Save data to JSON file
  async saveData(dataType, data) {
    try {
      const filename = this.files[dataType];
      if (!filename) {
        throw new Error(`Unknown data type: ${dataType}`);
      }

      // Convert model instances to JSON
      const jsonData = this.convertToJSON(data);
      
      const response = await fetch(`${this.dataPath}/${filename}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData, null, 2)
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${filename}: ${response.statusText}`);
      }

      console.log(`Successfully saved ${dataType} data`);
      return true;
    } catch (error) {
      console.error(`Error saving ${dataType}:`, error);
      return false;
    }
  }

  // Reset all data on the server to base seed
  async resetAllData() {
    try {
      const response = await fetch(`${this.dataPath}/reset`, { method: 'POST' });
      return response.ok;
    } catch (error) {
      console.error('Error resetting data:', error);
      return false;
    }
  }

  // Convert model instances to JSON
  convertToJSON(data) {
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item && typeof item.toJSON === 'function') {
          return item.toJSON();
        }
        return item;
      });
    }
    
    if (data && typeof data.toJSON === 'function') {
      return data.toJSON();
    }
    
    return data;
  }

  // Convert JSON data back to model instances
  convertToModels(dataType, jsonData) {
    if (!Array.isArray(jsonData)) {
      return [];
    }

    return jsonData.map(item => {
      switch (dataType) {
        case 'users':
          return new User(item);
        case 'employees':
          return new Employee(item);
        case 'shifts':
          return new Shift(item);
        case 'swapRequests':
          return new SwapRequest(item);
        case 'timeOffRequests':
          return new TimeOffRequest(item);
        case 'payrollRecords':
          return new PayrollRecord(item);
        case 'departments':
          return new Department(item);
        case 'notifications':
          return new Notification(item);
        default:
          return item;
      }
    });
  }

  // CRUD operations for each data type
  async getAll(dataType) {
    return await this.loadData(dataType);
  }

  async getById(dataType, id) {
    const data = await this.loadData(dataType);
    return data.find(item => item.id === id);
  }

  async create(dataType, item) {
    const data = await this.loadData(dataType);
    const newItem = { ...item, id: Date.now() };
    data.push(newItem);
    await this.saveData(dataType, data);
    return newItem;
  }

  async update(dataType, id, updates) {
    const data = await this.loadData(dataType);
    const index = data.findIndex(item => item.id === id);
    
    if (index !== -1) {
      data[index] = { ...data[index], ...updates };
      await this.saveData(dataType, data);
      return data[index];
    }
    
    return null;
  }

  async delete(dataType, id) {
    try {
      console.log(`DataService.delete called for ${dataType} with id:`, id);
      const data = await this.loadData(dataType);
      console.log(`Loaded ${dataType} data:`, data.length, 'items');
      
      const filteredData = data.filter(item => item.id !== id);
      console.log(`Filtered ${dataType} data:`, filteredData.length, `items (removed ${data.length - filteredData.length})`);
      
      const saveResult = await this.saveData(dataType, filteredData);
      console.log(`Save result for ${dataType}:`, saveResult);
      
      return saveResult;
    } catch (error) {
      console.error(`Error in DataService.delete for ${dataType}:`, error);
      throw error;
    }
  }

  // Specific methods for common operations
  async saveEmployee(employee) {
    const employees = await this.loadData('employees');
    const existingIndex = employees.findIndex(emp => emp.id === employee.id);
    
    if (existingIndex !== -1) {
      employees[existingIndex] = employee;
    } else {
      employees.push(employee);
    }
    
    await this.saveData('employees', employees);
    return employee;
  }

  async saveShift(shift) {
    const shifts = await this.loadData('shifts');
    const existingIndex = shifts.findIndex(s => s.id === shift.id);
    
    if (existingIndex !== -1) {
      shifts[existingIndex] = shift;
    } else {
      shifts.push(shift);
    }
    
    await this.saveData('shifts', shifts);
    return shift;
  }

  async saveSwapRequest(request) {
    const requests = await this.loadData('swapRequests');
    const existingIndex = requests.findIndex(r => r.id === request.id);
    
    if (existingIndex !== -1) {
      requests[existingIndex] = request;
    } else {
      requests.push(request);
    }
    
    await this.saveData('swapRequests', requests);
    return request;
  }

  async saveTimeOffRequest(request) {
    const requests = await this.loadData('timeOffRequests');
    const existingIndex = requests.findIndex(r => r.id === request.id);
    
    if (existingIndex !== -1) {
      requests[existingIndex] = request;
    } else {
      requests.push(request);
    }
    
    await this.saveData('timeOffRequests', requests);
    return request;
  }

  async savePayrollRecord(record) {
    const records = await this.loadData('payrollRecords');
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex !== -1) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    
    await this.saveData('payrollRecords', records);
    return record;
  }

  async saveNotification(notification) {
    const notifications = await this.loadData('notifications');
    const existingIndex = notifications.findIndex(n => n.id === notification.id);
    
    if (existingIndex !== -1) {
      notifications[existingIndex] = notification;
    } else {
      notifications.push(notification);
    }
    
    await this.saveData('notifications', notifications);
    return notification;
  }

  // Backup and restore functionality
  async backupData() {
    const backup = {};
    const dataTypes = Object.keys(this.files);
    
    for (const dataType of dataTypes) {
      backup[dataType] = await this.loadData(dataType);
    }
    
    const backupData = JSON.stringify(backup, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.json`;
    
    // Save backup file
    const response = await fetch(`${this.dataPath}/backups/${backupFilename}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: backupData
    });
    
    if (response.ok) {
      console.log(`Backup created: ${backupFilename}`);
      return backupFilename;
    } else {
      throw new Error('Failed to create backup');
    }
  }

  async restoreData(backupFilename) {
    try {
      const response = await fetch(`${this.dataPath}/backups/${backupFilename}`);
      if (!response.ok) {
        throw new Error('Backup file not found');
      }
      
      const backup = await response.json();
      const dataTypes = Object.keys(backup);
      
      for (const dataType of dataTypes) {
        if (this.files[dataType]) {
          await this.saveData(dataType, backup[dataType]);
        }
      }
      
      console.log('Data restored successfully');
      return true;
    } catch (error) {
      console.error('Error restoring data:', error);
      return false;
    }
  }
}

// Create a singleton instance
const dataService = new DataService();

export default dataService;
