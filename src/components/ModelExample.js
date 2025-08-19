import React, { useState } from 'react';
import { Employee, Shift, SwapRequest, Notification } from '../models/index.js';

/**
 * Example component demonstrating how to use the models
 * This component shows various model operations and can be used as a reference
 */
const ModelExample = () => {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Example: Create a new employee using the Employee model
  const createEmployee = () => {
    const newEmployee = new Employee({
      name: 'John Doe',
      email: 'john.doe@company.com',
      phone: '(555) 123-4567',
      role: 'Employee',
      hourlyRate: 15.00,
      departments: ['cashier', 'barista'],
      emergencyContact: 'Jane Doe',
      emergencyPhone: '(555) 987-6543'
    });

    // Validate the employee data
    if (newEmployee.isValid()) {
      setEmployees(prev => [...prev, newEmployee]);
      console.log('Employee created:', newEmployee.toJSON());
    } else {
      console.error('Invalid employee data');
    }
  };

  // Example: Create a shift for an employee
  const createShift = (employeeId) => {
    const shift = new Shift({
      employeeId: employeeId,
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '17:00',
      role: 'cashier',
      hourlyRate: 15.00
    });

    if (shift.isValid()) {
      setShifts(prev => [...prev, shift]);
      console.log('Shift created:', shift.toJSON());
    }
  };

  // Example: Create a swap request
  const createSwapRequest = (employeeId, shiftId) => {
    const swapRequest = new SwapRequest({
      requesterId: employeeId,
      shiftId: shiftId,
      reason: 'Doctor appointment',
      status: 'pending'
    });

    if (swapRequest.isValid()) {
      console.log('Swap request created:', swapRequest.toJSON());
      
      // Create a notification for the manager
      const notification = Notification.createSwapRequest(
        'John Doe', 
        '2024-01-15'
      );
      setNotifications(prev => [...prev, notification]);
    }
  };

  // Example: Check employee availability
  const checkAvailability = (employeeId, day, startTime, endTime) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      const isAvailable = employee.canWorkOn(day, startTime, endTime);
      console.log(`${employee.name} is ${isAvailable ? 'available' : 'not available'} on ${day} from ${startTime} to ${endTime}`);
      return isAvailable;
    }
    return false;
  };

  // Example: Calculate shift pay
  const calculateShiftPay = (shiftId) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
      const totalPay = shift.getTotalPay();
      console.log(`Shift ${shiftId} total pay: $${totalPay.toFixed(2)}`);
      return totalPay;
    }
    return 0;
  };

  // Example: Process a swap request
  const processSwapRequest = (requestId, approved) => {
    const request = swapRequests.find(r => r.id === requestId);
    if (request) {
      if (approved) {
        request.approve('manager_id', 'Approved by manager');
      } else {
        request.reject('manager_id', 'Rejected due to staffing requirements');
      }
      console.log('Swap request processed:', request.toJSON());
    }
  };

  // Example: Get employee statistics
  const getEmployeeStats = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      const stats = {
        name: employee.getFullName(),
        primaryDepartment: employee.getPrimaryDepartment(),
        weeklyAvailabilityHours: employee.getWeeklyAvailabilityHours(),
        hasWeekendAvailability: employee.availability.isWeekendAvailable(),
        departments: employee.departments
      };
      console.log('Employee stats:', stats);
      return stats;
    }
    return null;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Model Usage Examples</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Employee Operations</h3>
          <button 
            onClick={createEmployee}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Employee
          </button>
          <p className="text-sm text-gray-600 mt-1">
            Creates a new employee using the Employee model with validation
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Shift Operations</h3>
          <button 
            onClick={() => createShift(1)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create Shift
          </button>
          <p className="text-sm text-gray-600 mt-1">
            Creates a new shift using the Shift model
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Swap Request Operations</h3>
          <button 
            onClick={() => createSwapRequest(1, 1)}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Create Swap Request
          </button>
          <p className="text-sm text-gray-600 mt-1">
            Creates a swap request and generates a notification
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Current Data</h3>
          <div className="text-sm">
            <p>Employees: {employees.length}</p>
            <p>Shifts: {shifts.length}</p>
            <p>Notifications: {notifications.length}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Model Features Demonstrated</h3>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Data validation with <code>isValid()</code> methods</li>
            <li>Business logic methods like <code>canWorkOn()</code> and <code>getTotalPay()</code></li>
            <li>Status management with <code>approve()</code> and <code>reject()</code></li>
            <li>JSON serialization with <code>toJSON()</code> methods</li>
            <li>Static factory methods like <code>Notification.createSwapRequest()</code></li>
            <li>Model relationships and data consistency</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModelExample;
