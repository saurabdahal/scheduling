import React, { useEffect } from 'react';
import { 
  User, 
  Employee, 
  Shift, 
  SwapRequest, 
  TimeOffRequest, 
  PayrollRecord, 
  Availability, 
  Department, 
  Notification,
  generateDemoData 
} from '../models/index.js';

const ModelTest = () => {
  useEffect(() => {
    console.log('=== MODEL TEST START ===');
    
    // Test User model
    console.log('Testing User model...');
    const user = new User({
      id: 1,
      username: 'testuser',
      password: 'password123',
      role: 'Manager',
      email: 'test@example.com'
    });
    console.log('User instance:', user);
    console.log('User is valid:', user.isValid());
    console.log('User is admin:', user.isAdmin());
    console.log('User is manager:', user.isManager());
    console.log('Available roles:', User.getAvailableRoles());
    
    // Test Employee model
    console.log('\nTesting Employee model...');
    const availability = new Availability({
      monday: { available: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '09:00', endTime: '17:00' }
    });
    
    const employee = new Employee({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      role: 'cashier',
      hourlyRate: 15,
      availability: availability
    });
    console.log('Employee instance:', employee);
    console.log('Employee is valid:', employee.isValid());
    console.log('Employee is active:', employee.isActive());
    console.log('Employee primary department:', employee.getPrimaryDepartment());
    
    // Test Shift model
    console.log('\nTesting Shift model...');
    const shift = new Shift({
      id: 1,
      employeeId: 1,
      employeeName: 'John Doe',
      date: '2025-01-20',
      startTime: '09:00',
      endTime: '17:00',
      role: 'cashier',
      status: 'scheduled'
    });
    console.log('Shift instance:', shift);
    console.log('Shift is valid:', shift.isValid());
    console.log('Shift duration:', shift.getDuration());
    console.log('Shift status color:', shift.getStatusColor());
    
    // Test shift overlap
    const shift2 = new Shift({
      id: 2,
      employeeId: 1,
      employeeName: 'John Doe',
      date: '2025-01-20',
      startTime: '16:00',
      endTime: '20:00',
      role: 'cashier',
      status: 'scheduled'
    });
    console.log('Shift overlaps with shift2:', shift.overlapsWith(shift2));
    
    // Test SwapRequest model
    console.log('\nTesting SwapRequest model...');
    const swapRequest = new SwapRequest({
      id: 1,
      requesterId: 1,
      requesterName: 'John Doe',
      shiftId: 1,
      shiftDate: '2025-01-20',
      shiftTime: '09:00-17:00',
      reason: 'Doctor appointment',
      status: 'pending'
    });
    console.log('SwapRequest instance:', swapRequest);
    console.log('SwapRequest is valid:', swapRequest.isValid());
    console.log('SwapRequest age:', swapRequest.getAge());
    
    // Test TimeOffRequest model
    console.log('\nTesting TimeOffRequest model...');
    const timeOffRequest = new TimeOffRequest({
      id: 1,
      employeeId: 1,
      employeeName: 'John Doe',
      startDate: '2025-01-25',
      endDate: '2025-01-27',
      reason: 'Vacation',
      type: 'vacation',
      status: 'pending'
    });
    console.log('TimeOffRequest instance:', timeOffRequest);
    console.log('TimeOffRequest is valid:', timeOffRequest.isValid());
    console.log('TimeOffRequest duration:', timeOffRequest.getDuration());
    
    // Test PayrollRecord model
    console.log('\nTesting PayrollRecord model...');
    const payrollRecord = new PayrollRecord({
      id: 1,
      employeeId: 1,
      employeeName: 'John Doe',
      payPeriodStart: '2025-01-01',
      payPeriodEnd: '2025-01-15',
      totalHours: 80,
      regularHours: 80,
      hourlyRate: 15
    });
    console.log('PayrollRecord instance:', payrollRecord);
    console.log('PayrollRecord is valid:', payrollRecord.isValid());
    console.log('PayrollRecord total pay:', payrollRecord.totalPay);
    
    // Test Department model
    console.log('\nTesting Department model...');
    const department = new Department({
      id: 1,
      name: 'Front Office',
      code: 'FO',
      description: 'Customer-facing operations',
      managerId: 1,
      managerName: 'John Manager',
      requiredSkills: ['customer-service', 'cash-handling'],
      minimumStaffing: 2,
      maximumStaffing: 5,
      hourlyRate: 15
    });
    console.log('Department instance:', department);
    console.log('Department is valid:', department.isValid());
    console.log('Department is active:', department.isActive());
    
    // Test Notification model
    console.log('\nTesting Notification model...');
    const notification = new Notification({
      id: 1,
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification',
      userId: 1,
      priority: 'medium'
    });
    console.log('Notification instance:', notification);
    console.log('Notification is valid:', notification.isValid());
    console.log('Notification is read:', notification.isRead);
    
    // Test factory methods
    console.log('\nTesting Notification factory methods...');
    const shiftConflictNotification = Notification.createShiftConflict('John Doe', '2025-01-20', '09:00-17:00');
    console.log('Shift conflict notification:', shiftConflictNotification);
    
    const payrollNotification = Notification.createPayrollReady('John Doe', '2025-01-01', '2025-01-15');
    console.log('Payroll notification:', payrollNotification);
    
    // Test demo data generation
    console.log('\nTesting demo data generation...');
    const demoData = generateDemoData();
    console.log('Demo users:', demoData.users().length);
    console.log('Demo employees:', demoData.employees().length);
    console.log('Demo shifts:', demoData.shifts().length);
    
    console.log('=== MODEL TEST END ===');
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Model Test Component</h2>
      <p className="text-gray-600">
        Check the browser console to see the test results for all models.
      </p>
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800">
          ✓ All models have been tested. If you see any errors in the console, 
          please report them.
        </p>
      </div>
    </div>
  );
};

export default ModelTest;
