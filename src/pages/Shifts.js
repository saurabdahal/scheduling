import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, subWeeks, parseISO, startOfWeek, addDays } from 'date-fns';
import ScheduleGrid from '../components/ScheduleGrid';
import ShiftCard from '../components/ShiftCard';
import ShiftEditModal from '../components/ShiftEditModal';
import NotificationBanner from '../components/NotificationBanner';
import { Shift, User, Notification } from '../models/index.js';
import { populateEmployeeNames, getEmployeeName } from '../models/utils.js';
import dataService from '../services/DataService.js';
import notificationService from '../services/NotificationService.js';

const Shifts = ({ user, employees = [], shifts = [], onUpdateShifts }) => {
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  
  const [currentDate, setCurrentDate] = useState(new Date());



  function generateDemoShiftsForWeek(dateInWeek, employeesList) {
    const weekStart = startOfWeek(dateInWeek, { weekStartsOn: 1 });
    const shifts = [];
    let shiftId = 1;
    
    // Generate shifts for each day of the week (Monday to Friday)
    for (let i = 0; i < 5; i++) {
      const date = addDays(weekStart, i);
      
      // Create shifts for each employee
      employeesList.forEach(emp => {
        let status = 'scheduled';
        
        // Determine status based on date (past = completed, current = in-progress, future = scheduled)
        const today = new Date();
        const shiftDate = new Date(date);
        
        if (shiftDate < today) {
          status = 'completed';
        } else if (shiftDate.toDateString() === today.toDateString()) {
          status = 'in-progress';
        }
        
        // Create shift using the Shift model
        const shift = new Shift({
          id: shiftId++,
          employeeId: emp.id,
          employeeName: emp.name,
          date: date.toISOString().slice(0, 10),
          startTime: '09:00',
          endTime: '17:00',
          role: emp.getPrimaryDepartment() || 'cashier',
          status,
          notes: '',
          hourlyRate: emp.hourlyRate
        });
        
        shifts.push(shift);
      });
    }
    
    return shifts;
  }

  // Find the employee record for the logged-in user
  const currentEmployee = employees.find(emp => 
    emp.email === user.email || 
    emp.userId === user.id || 
    emp.id === user.id
  );
  

  
  // Populate employee names for all shifts to fix "Unknown Employee" issue
  const shiftsWithEmployeeNames = populateEmployeeNames(shifts, employees);
  
  // Only show current employee's shifts for employees, all for managers/admins
  const visibleShifts = isAdminOrManager
    ? shiftsWithEmployeeNames
    : shiftsWithEmployeeNames.filter(shift => shift.employeeId === currentEmployee?.id);
    
  // If no shifts are loaded and user is admin/manager, show a message
  const noShiftsMessage = shifts.length === 0 && isAdminOrManager 
    ? 'No shifts have been created yet. Use the "Create Shift" button to add shifts.'
    : shifts.length === 0 && !isAdminOrManager
    ? 'No shifts have been assigned to you yet.'
    : null;
    


  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [notification, setNotification] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const [shiftForm, setShiftForm] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    role: 'cashier',
    notes: ''
  });
  
  // Ref to prevent duplicate conflict notifications
  const conflictsCheckedRef = useRef(false);



  // Check for conflicts - only run when shifts or employees change, not on every render
  useEffect(() => {
    // Prevent running if no shifts or employees loaded yet
    if (!shifts.length || !employees.length) return;
    
    // Prevent duplicate conflict checks
    if (conflictsCheckedRef.current) return;
    
    const checkConflicts = async () => {
      const newConflicts = [];
      
      // Only check conflicts for shifts that are visible to the current user
      const shiftsToCheck = isAdminOrManager ? shifts : visibleShifts;
      
      for (const shift of shiftsToCheck) {
        // Check for overlapping shifts for same employee using model method
        const overlapping = shifts.filter(s => 
          s.id !== shift.id && shift.overlapsWith(s)
        );
        
        if (overlapping.length > 0) {
          const employeeName = shift.employeeName || employees.find(e => e.id === shift.employeeId)?.name || `Employee ${shift.employeeId}`;
          newConflicts.push({
            type: 'overlap',
            shiftId: shift.id,
            message: `Overlapping shifts for ${employeeName}`
          });
          
          // Only create conflict notification if it doesn't already exist
          try {
            const existingNotifications = await dataService.getAll('notifications');
            const conflictExists = existingNotifications.some(n => 
              n.type === 'warning' && 
              n.category === 'shift' && 
              n.metadata?.conflictType === 'Shift Overlap' &&
              n.metadata?.employeeName === employeeName &&
              n.metadata?.date === shift.date
            );
            
            if (!conflictExists) {
              await notificationService.createConflictNotification(
                'Shift Overlap',
                employeeName,
                shift.date,
                `${shift.startTime} - ${shift.endTime}`,
                'high'
              );
            }
          } catch (error) {
            console.error('Error creating conflict notification:', error);
          }
        }

        // Check for overtime (more than 8 hours per day)
        const sameDayShifts = shifts.filter(s => 
          s.employeeId === shift.employeeId && 
          s.date === shift.date
        );
        
        const totalHours = sameDayShifts.reduce((total, s) => {
          const start = parseISO(`2000-01-01T${s.startTime}`);
          const end = parseISO(`2000-01-01T${s.endTime}`);
          return total + (end - start) / (1000 * 60 * 60);
        }, 0);

        if (totalHours > 8) {
          const employeeName = shift.employeeName || employees.find(e => e.id === shift.employeeId)?.name || `Employee ${shift.employeeId}`;
          newConflicts.push({
            type: 'overtime',
            shiftId: shift.id,
            message: `Overtime alert: ${employeeName} has ${totalHours.toFixed(1)} hours`
          });
        }
      }

      setConflicts(newConflicts);
      conflictsCheckedRef.current = true; // Mark as checked
    };

    checkConflicts();
  }, [shifts, employees, isAdminOrManager, visibleShifts]);

  const handleCreateShift = async () => {
    // Check if user has permission to create shifts
    if (!isAdminOrManager) {
      setNotification({ type: 'error', message: 'You do not have permission to create shifts' });
      return;
    }

    if (!shiftForm.employeeId) {
      setNotification({ type: 'error', message: 'Please select an employee' });
      return;
    }

    // Get the employee details to include the name
    const selectedEmployee = employees.find(emp => emp.id === parseInt(shiftForm.employeeId));
    
    // Create new shift using the Shift model
    const newShift = new Shift({
      id: Date.now(),
      employeeId: parseInt(shiftForm.employeeId),
      employeeName: selectedEmployee.name,
      date: shiftForm.date,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      role: shiftForm.role,
      status: 'scheduled',
      notes: shiftForm.notes,
      hourlyRate: selectedEmployee.hourlyRate || 15
    });

    try {
      await dataService.saveShift(newShift);
      onUpdateShifts([...shifts, newShift]);
      
      // Create notification for the employee about their new shift
      try {
        // Find the user ID for the employee by matching email
        const users = await dataService.getAll('users');
        const employeeUser = users.find(u => u.email === selectedEmployee.email);
        
        if (employeeUser) {
                     const shiftNotification = new Notification({
             type: 'info',
             title: 'New Shift Assigned',
             message: `You have been assigned a new shift on ${format(parseISO(newShift.date), 'MMM dd, yyyy')} from ${newShift.startTime} to ${newShift.endTime}`,
             userId: employeeUser.id,
             recipientRole: 'Employee',
             category: 'shift',
             priority: 'normal',
             actionUrl: '/shifts',
             actionText: 'View My Schedule'
           });
          
                    console.log('Creating shift notification for employee:', shiftNotification);
          await notificationService.createNotification(shiftNotification);
          
          // Also create a notification for managers to see
          const managerNotification = new Notification({
             type: 'success',
             title: 'Shift Created',
             message: `New shift created for ${selectedEmployee.name} on ${format(parseISO(newShift.date), 'MMM dd, yyyy')}`,
             recipientRole: 'Manager',
             category: 'shift',
             priority: 'normal',
             actionUrl: '/shifts',
             actionText: 'View Schedule'
           });
          
          await notificationService.createNotification(managerNotification);
        }
      } catch (notificationError) {
        console.error('Error creating shift notification:', notificationError);
        // Don't let notification error break the shift creation
      }
      
      setShowShiftModal(false);
      setShiftForm({
        employeeId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '17:00',
        role: 'cashier',
        notes: ''
      });
      setNotification({ type: 'success', message: 'Shift created successfully' });
    } catch (error) {
      console.error('Error saving shift:', error);
      setNotification({ type: 'error', message: 'Failed to create shift' });
    }
  };

  const handleUpdateShift = async (updatedProperties) => {
    // Check if user has permission to update shifts
    if (!isAdminOrManager) {
      setNotification({ type: 'error', message: 'You do not have permission to update shifts' });
      return;
    }

    try {
      // Find the existing shift and update it using model methods
      const existingShift = shifts.find(s => s.id === updatedProperties.id);
      if (existingShift) {
        // Store original values for comparison
        const originalDate = existingShift.date;
        const originalStartTime = existingShift.startTime;
        const originalEndTime = existingShift.endTime;
        const originalEmployeeId = existingShift.employeeId;
        
        // Update the shift properties
        Object.assign(existingShift, updatedProperties);
        
        // Ensure the employeeName field is preserved
        if (!existingShift.employeeName) {
          existingShift.employeeName = employees.find(e => e.id === existingShift.employeeId)?.name;
        }
        
        // Save to file
        await dataService.saveShift(existingShift);
        onUpdateShifts([...shifts]); // Trigger re-render
        
        // Create notification for the employee if significant changes were made
        try {
          const hasSignificantChanges = 
            originalDate !== existingShift.date ||
            originalStartTime !== existingShift.startTime ||
            originalEndTime !== existingShift.endTime ||
            originalEmployeeId !== existingShift.employeeId;
          
          if (hasSignificantChanges) {
            const users = await dataService.getAll('users');
            const employee = employees.find(e => e.id === existingShift.employeeId);
            const employeeUser = users.find(u => u.email === employee?.email);
            
                         if (employeeUser && employee) {
               const shiftUpdateNotification = new Notification({
                 type: 'warning',
                 title: 'Shift Updated',
                 message: `Your shift on ${format(parseISO(existingShift.date), 'MMM dd, yyyy')} has been updated. New time: ${existingShift.startTime} to ${existingShift.endTime}`,
                 userId: employeeUser.id,
                 recipientRole: 'Employee',
                 category: 'shift',
                 priority: 'normal',
                 actionUrl: '/shifts',
                 actionText: 'View My Schedule'
               });
               
               await notificationService.createNotification(shiftUpdateNotification);
               
               // Also notify managers
               const managerUpdateNotification = new Notification({
                 type: 'info',
                 title: 'Shift Updated',
                 message: `Shift updated for ${employee.name} on ${format(parseISO(existingShift.date), 'MMM dd, yyyy')}`,
                 recipientRole: 'Manager',
                 category: 'shift',
                 priority: 'normal',
                 actionUrl: '/shifts',
                 actionText: 'View Schedule'
               });
               
               await notificationService.createNotification(managerUpdateNotification);
             }
          }
        } catch (notificationError) {

          // Don't let notification error break the shift update
        }
        
        setNotification({ type: 'success', message: 'Shift updated successfully' });
      }
    } catch (error) {
      console.error('Error updating shift:', error);
      setNotification({ type: 'error', message: 'Failed to update shift' });
    }
  };

  const handleDeleteShift = async (shiftId) => {
    // Check if user has permission to delete shifts
    if (!isAdminOrManager) {
      setNotification({ type: 'error', message: 'You do not have permission to delete shifts' });
      return;
    }

    try {

      
      // Find the shift to be deleted to get employee info for notification
      const shiftToDelete = shifts.find(s => s.id === shiftId);
      
      const result = await dataService.delete('shifts', shiftId);

      
      if (result) {
        const updatedShifts = shifts.filter(s => s.id !== shiftId);

        onUpdateShifts(updatedShifts);
        
        // Create notification for the employee about shift cancellation
        if (shiftToDelete) {
          try {
            const users = await dataService.getAll('users');
            const employee = employees.find(e => e.id === shiftToDelete.employeeId);
            const employeeUser = users.find(u => u.email === employee?.email);
            
                         if (employeeUser && employee) {
                               const shiftCancelNotification = new Notification({
                  type: 'error',
                  title: 'Shift Cancelled',
                  message: `Your shift on ${format(parseISO(shiftToDelete.date), 'MMM dd, yyyy')} from ${shiftToDelete.startTime} to ${shiftToDelete.endTime} has been cancelled`,
                  userId: employeeUser.id,
                  recipientRole: 'Employee',
                  category: 'shift',
                  priority: 'high',
                  actionUrl: '/shifts',
                  actionText: 'View My Schedule'
                });
               
               await notificationService.createNotification(shiftCancelNotification);
               
                               // Also notify managers
                const managerCancelNotification = new Notification({
                  type: 'warning',
                  title: 'Shift Cancelled',
                  message: `Shift cancelled for ${employee.name} on ${format(parseISO(shiftToDelete.date), 'MMM dd, yyyy')}`,
                  recipientRole: 'Manager',
                  category: 'shift',
                  priority: 'high',
                  actionUrl: '/shifts',
                  actionText: 'View Schedule'
                });
               
               await notificationService.createNotification(managerCancelNotification);
             }
          } catch (notificationError) {

            // Don't let notification error break the shift deletion
          }
        }
        
        setNotification({ type: 'success', message: 'Shift deleted successfully' });
      } else {
        throw new Error('Delete operation returned false');
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      setNotification({ type: 'error', message: `Failed to delete shift: ${error.message}` });
    }
  };

  const handleMarkAttendance = async (shiftId, status) => {
    try {
      const shift = shifts.find(s => s.id === shiftId);
      if (shift) {
        // Check if user has permission to mark attendance for this shift
        if (!isAdminOrManager && currentEmployee?.id !== shift.employeeId) {
          setNotification({ type: 'error', message: 'You can only mark attendance for your own shifts' });
          return;
        }

        shift.status = status;
        await dataService.saveShift(shift);
        onUpdateShifts([...shifts]); // Trigger re-render
        setNotification({ type: 'success', message: `Shift marked as ${status}` });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setNotification({ type: 'error', message: 'Failed to mark attendance' });
    }
  };

  const getEligibleEmployees = (role) => {
    // Always show all employees regardless of role for now
    // This ensures all saved employees are visible in the dropdown
    const allEmployees = employees || [];
    
    if (!employeeSearch) return allEmployees;
    
    const q = employeeSearch.toLowerCase();
    const filtered = allEmployees.filter(emp => 
      emp.name.toLowerCase().includes(q) || 
      (emp.email || '').toLowerCase().includes(q)
    );

    return filtered;
  };

  const getEmployeeById = (id) => {
    return employees.find(emp => emp.id === id);
  };

  const getShiftsForDate = (date) => {
    return shifts.filter(shift => shift.date === format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="p-6 space-y-6">
             {/* Data Loading Status */}
       {employees.length === 0 && (
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
           <div className="flex items-center">
             <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <p className="text-blue-800">Loading employee data...</p>
           </div>
         </div>
       )}
       
       {/* Header */}
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdminOrManager ? 'Shift Management' : 'My Schedule'}
          </h1>
          <p className="text-gray-600">
            {isAdminOrManager ? 'Manage employee schedules and shifts' : 'View your upcoming shifts'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Previous Week
          </button>
          <span className="text-lg font-medium">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next Week
          </button>
          {isAdminOrManager && (
            <button
              onClick={() => setShowShiftModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Shift
            </button>
          )}
        </div>  
      </div>



      {/* Conflicts Banner */}
      {conflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-yellow-800">Schedule Conflicts Detected</h3>
          </div>
          <div className="mt-2">
            {conflicts.map((conflict, index) => (
              <p key={index} className="text-sm text-yellow-700">{conflict.message}</p>
            ))}
          </div>
        </div>
      )}

             {/* Schedule Grid */}
       <ScheduleGrid
         shifts={visibleShifts}
         employees={employees}
         onShiftUpdate={handleUpdateShift}
         onShiftCreate={handleCreateShift}
         onShiftDelete={handleDeleteShift}
         currentDate={currentDate}
       />

       {/* Shifts List with Delete Functionality */}
       <div className="bg-white rounded-lg shadow">
         <div className="px-6 py-4 border-b border-gray-200">
           <h2 className="text-lg font-semibold text-gray-900">All Shifts ({visibleShifts.length})</h2>
           <p className="text-sm text-gray-600">Manage individual shifts with full actions</p>
         </div>
         <div className="p-6">
           {visibleShifts.length === 0 ? (
             <div className="text-center py-8">
               <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
               </svg>
               <p className="text-gray-500">{noShiftsMessage || 'No shifts found'}</p>
               {isAdminOrManager && shifts.length === 0 && (
                 <p className="text-sm text-gray-400 mt-2">The system is ready to create shifts. No data has been loaded yet.</p>
               )}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {visibleShifts.map(shift => (
                 <ShiftCard
                   key={shift.id}
                   shift={shift}
                   employee={employees.find(emp => emp.id === shift.employeeId)}
                   onEdit={(shift) => {
                     setEditingShift(shift);
                     setShowEditModal(true);
                   }}
                   onDelete={handleDeleteShift}
                   onMarkAttendance={handleMarkAttendance}
                   isEditable={isAdminOrManager}
                   showActions={true}
                   currentUser={user}
                   currentEmployee={currentEmployee}
                 />
               ))}
             </div>
           )}
         </div>
       </div>

      {/* Shift Creation Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Shift</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={shiftForm.employeeId}
                  onChange={(e) => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
                  className="mt-2 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {(() => {
                    const eligibleEmployees = getEligibleEmployees(shiftForm.role);

                    
                    if (eligibleEmployees.length === 0) {
                      return <option value="" disabled>No employees available</option>;
                    }
                    
                    return eligibleEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ));
                  })()}
                                  </select>
                  {(() => {
                    const eligibleEmployees = getEligibleEmployees(shiftForm.role);
                    if (eligibleEmployees.length === 0) {
                      return (
                        <p className="mt-1 text-sm text-amber-600">
                          No employees found for this role. 
                          {employees && employees.length > 0 ? (
                            <span> Try selecting a different role or create employees first.</span>
                          ) : (
                            <span> No employees exist yet. Please create employees in Staff Management first.</span>
                          )}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={shiftForm.date}
                  onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={shiftForm.role}
                  onChange={(e) => setShiftForm({ ...shiftForm, role: e.target.value, employeeId: '' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cashier">Cashier</option>
                  <option value="barista">Barista</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="food-prep">Food Prep</option>
                  <option value="coffee-making">Coffee Making</option>
                  <option value="baking">Baking</option>
                  <option value="management">Management</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateShift}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Create Shift
              </button>
              <button
                onClick={() => setShowShiftModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Edit Modal */}
      {showEditModal && editingShift && (
        <ShiftEditModal
          shift={editingShift}
          employees={employees}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingShift(null);
          }}
          onSave={handleUpdateShift}
        />
      )}

      {/* Notification */}
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Shifts; 