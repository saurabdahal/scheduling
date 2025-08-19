# Models Documentation

This directory contains all the data models for the scheduling application. These models provide a structured way to handle data throughout the application and can be easily converted to database schemas later.

## Overview

The models are designed to be:
- **Self-contained**: Each model handles its own validation and business logic
- **Database-ready**: Models can be easily converted to database schemas
- **Type-safe**: Models provide consistent data structures
- **Reusable**: Models can be used across different parts of the application

## Available Models

### 1. User Model (`User.js`)
Represents authentication and user management data.

**Key Features:**
- User authentication and roles
- Permission management
- Role hierarchy (Admin > Manager > Supervisor > Employee)

**Usage:**
```javascript
import { User } from './models/User.js';

const user = new User({
  username: 'john_doe',
  password: 'password123',
  role: 'Employee',
  email: 'john@company.com'
});

// Check permissions
if (user.isManager()) {
  // Manager-specific logic
}
```

### 2. Employee Model (`Employee.js`)
Represents employee data including personal info, work details, and availability.

**Key Features:**
- Personal information management
- Department/skill tracking
- Availability scheduling
- Work history

**Usage:**
```javascript
import { Employee } from './models/Employee.js';

const employee = new Employee({
  name: 'Jane Smith',
  email: 'jane@company.com',
  role: 'Employee',
  hourlyRate: 15.00,
  departments: ['cashier', 'barista']
});

// Check availability
if (employee.canWorkOn('monday', '09:00', '17:00')) {
  // Employee is available
}
```

### 3. Availability Model (`Availability.js`)
Represents employee availability for each day of the week.

**Key Features:**
- Daily availability tracking
- Time slot management
- Weekly hour calculations

**Usage:**
```javascript
import { Availability } from './models/Availability.js';

const availability = new Availability({
  monday: { available: true, startTime: '09:00', endTime: '17:00' },
  tuesday: { available: true, startTime: '09:00', endTime: '17:00' }
});

const weeklyHours = availability.getWeeklyHours();
```

### 4. Shift Model (`Shift.js`)
Represents work shifts including scheduling, timing, and status information.

**Key Features:**
- Shift scheduling and management
- Time tracking (scheduled vs actual)
- Status management (scheduled, in-progress, completed, cancelled)
- Overtime calculations

**Usage:**
```javascript
import { Shift } from './models/Shift.js';

const shift = new Shift({
  employeeId: 1,
  date: '2024-01-15',
  startTime: '09:00',
  endTime: '17:00',
  role: 'cashier'
});

// Check shift status
if (shift.isToday() && shift.isInProgress()) {
  // Shift is currently happening
}

// Calculate pay
const totalPay = shift.getTotalPay();
```

### 5. SwapRequest Model (`SwapRequest.js`)
Represents shift swap requests between employees.

**Key Features:**
- Request management (pending, approved, rejected, cancelled)
- Approval workflow
- Conflict detection

**Usage:**
```javascript
import { SwapRequest } from './models/SwapRequest.js';

const swapRequest = new SwapRequest({
  requesterId: 1,
  shiftId: 123,
  reason: 'Doctor appointment'
});

// Approve request
swapRequest.approve('manager_id', 'Approved');
```

### 6. TimeOffRequest Model (`TimeOffRequest.js`)
Represents time off requests from employees.

**Key Features:**
- Time off type management (vacation, sick, personal, etc.)
- Date range handling
- Approval workflow

**Usage:**
```javascript
import { TimeOffRequest } from './models/TimeOffRequest.js';

const timeOffRequest = new TimeOffRequest({
  employeeId: 1,
  startDate: '2024-02-01',
  endDate: '2024-02-05',
  type: 'vacation',
  reason: 'Family vacation'
});

const duration = timeOffRequest.getDurationInDays();
```

### 7. PayrollRecord Model (`PayrollRecord.js`)
Represents payroll calculations and records for employees.

**Key Features:**
- Pay period management
- Hour calculations (regular, overtime)
- Tax and deduction handling
- Payment processing

**Usage:**
```javascript
import { PayrollRecord } from './models/PayrollRecord.js';

const payrollRecord = new PayrollRecord({
  employeeId: 1,
  payPeriodStart: '2024-01-01',
  payPeriodEnd: '2024-01-15',
  hourlyRate: 15.00
});

// Calculate from shifts
payrollRecord.calculateFromShifts(shiftsArray);
```

### 8. Department Model (`Department.js`)
Represents departments/roles in the organization.

**Key Features:**
- Department management
- Required skills tracking
- Staffing requirements
- Color coding for UI

**Usage:**
```javascript
import { Department } from './models/Department.js';

const department = new Department({
  name: 'Barista',
  code: 'barista',
  requiredSkills: ['coffee-making', 'customer-service'],
  minimumStaffing: 2
});

// Check staffing status
const status = department.getStaffingStatus(currentStaffCount);
```

### 9. Notification Model (`Notification.js`)
Represents system notifications and alerts.

**Key Features:**
- Notification types (success, error, warning, info)
- Priority management
- Action handling
- Expiration management

**Usage:**
```javascript
import { Notification } from './models/Notification.js';

const notification = new Notification({
  type: 'warning',
  title: 'Shift Conflict',
  message: 'Overlapping shifts detected',
  priority: 'high'
});

// Create common notifications
const conflictNotification = Notification.createShiftConflict('John Doe', '2024-01-15', '09:00');
```

## Utilities (`utils.js`)

The utils file provides helper functions for working with models:

### Model Creation
```javascript
import { createModelsFromData, createModelArraysFromData } from './models/utils.js';

// Create single model
const employee = createModelsFromData.employee(employeeData);

// Create array of models
const employees = createModelArraysFromData.employees(employeesDataArray);
```

### Model Conversion
```javascript
import { convertModelsToJSON, convertModelArraysToJSON } from './models/utils.js';

// Convert to JSON for storage/API
const employeeJSON = convertModelsToJSON.employee(employee);
const employeesJSON = convertModelArraysToJSON.employees(employeesArray);
```

### Validation
```javascript
import { validateModels } from './models/utils.js';

// Validate model data
const isValid = validateModels.employee(employeeData);
```

### Demo Data Generation
```javascript
import { generateDemoData } from './models/utils.js';

// Generate demo data
const demoEmployees = generateDemoData.employees();
const demoUsers = generateDemoData.users();
const demoDepartments = generateDemoData.departments();
```

## Database Schema Conversion

When ready to create a database, each model can be converted to a database schema. Here's an example structure:

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

### Employees Table
```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  departments JSON,
  status VARCHAR(50) DEFAULT 'active',
  hire_date DATE,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Shifts Table
```sql
CREATE TABLE shifts (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  actual_start_time TIME,
  actual_end_time TIME,
  role VARCHAR(50),
  status VARCHAR(50) DEFAULT 'scheduled',
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Best Practices

1. **Always use models for data handling**: Instead of plain objects, use model instances
2. **Validate data**: Use the built-in validation methods before saving
3. **Use utility functions**: Leverage the utility functions for common operations
4. **Keep models focused**: Each model should handle its own domain logic
5. **Use type checking**: Models provide consistent data structures

## Migration Guide

To migrate existing code to use models:

1. **Import models**: Add imports for the models you need
2. **Replace plain objects**: Convert plain object data to model instances
3. **Use model methods**: Replace custom logic with model methods
4. **Update validation**: Use model validation instead of custom validation
5. **Test thoroughly**: Ensure all functionality works with the new models

## Future Enhancements

- **TypeScript support**: Add TypeScript definitions for better type safety
- **Database integration**: Add database adapters for each model
- **Caching**: Implement model caching for better performance
- **Validation rules**: Add more sophisticated validation rules
- **API integration**: Add API methods for remote data operations
