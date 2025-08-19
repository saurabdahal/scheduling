import React, { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, parseISO, startOfWeek, addDays } from 'date-fns';
import ScheduleGrid from '../components/ScheduleGrid';
import ShiftCard from '../components/ShiftCard';
import NotificationBanner from '../components/NotificationBanner';
import { Shift, User, Notification } from '../models/index.js';
import dataService from '../services/DataService.js';

const Shifts = ({ user, employees = [], shifts = [], onUpdateShifts }) => {
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  
  const [currentDate, setCurrentDate] = useState(new Date());

  // Do not auto-generate demo shifts; start empty until user creates
  useEffect(() => {
    // no-op; shifts come from storage and user actions
  }, [currentDate, employees, shifts.length, onUpdateShifts]);

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
  const currentEmployee = employees.find(emp => emp.email === user.email || emp.userId === user.id);
  
  // Debug logging for employee filtering
  console.log('Employee filtering debug:', {
    user: { id: user.id, email: user.email, role: user.role },
    currentEmployee: currentEmployee ? { id: currentEmployee.id, name: currentEmployee.name, email: currentEmployee.email } : null,
    totalShifts: shifts.length,
    isAdminOrManager
  });
  
  // Only show current employee's shifts for employees, all for managers/admins
  const visibleShifts = isAdminOrManager
    ? shifts
    : shifts.filter(shift => shift.employeeId === currentEmployee?.id);
    
  console.log('Visible shifts:', {
    total: shifts.length,
    visible: visibleShifts.length,
    employeeShifts: isAdminOrManager ? 'All' : visibleShifts.map(s => ({ id: s.id, date: s.date, employeeId: s.employeeId }))
  });

  const [showShiftModal, setShowShiftModal] = useState(false);
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

  // Check for conflicts
  useEffect(() => {
    const newConflicts = [];
    
    // Only check conflicts for shifts that are visible to the current user
    const shiftsToCheck = isAdminOrManager ? shifts : visibleShifts;
    
    shiftsToCheck.forEach(shift => {
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
        
        // Create notification for conflict
        const conflictNotification = Notification.createShiftConflict(
          employeeName,
          shift.date,
          `${shift.startTime}-${shift.endTime}`
        );
        console.log('Shift conflict detected:', conflictNotification.toJSON());
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
    });

    setConflicts(newConflicts);
  }, [shifts, employees, isAdminOrManager, visibleShifts]);

  const handleCreateShift = async () => {
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
    try {
      // Find the existing shift and update it using model methods
      const existingShift = shifts.find(s => s.id === updatedProperties.id);
      if (existingShift) {
        // Update the shift properties
        Object.assign(existingShift, updatedProperties);
        
        // Ensure the employeeName field is preserved
        if (!existingShift.employeeName) {
          existingShift.employeeName = employees.find(e => e.id === existingShift.employeeId)?.name;
        }
        
        // Save to file
        await dataService.saveShift(existingShift);
        onUpdateShifts([...shifts]); // Trigger re-render
        setNotification({ type: 'success', message: 'Shift updated successfully' });
      }
    } catch (error) {
      console.error('Error updating shift:', error);
      setNotification({ type: 'error', message: 'Failed to update shift' });
    }
  };

  const handleDeleteShift = async (shiftId) => {
    try {
      console.log('Attempting to delete shift:', shiftId);
      console.log('Current shifts before deletion:', shifts.length);
      
      const result = await dataService.delete('shifts', shiftId);
      console.log('Delete result:', result);
      
      if (result) {
        const updatedShifts = shifts.filter(s => s.id !== shiftId);
        console.log('Shifts after filtering:', updatedShifts.length);
        onUpdateShifts(updatedShifts);
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
    console.log('getEligibleEmployees called with:', { role, employeesCount: employees?.length, employees });
    
    // If no role is selected, show all employees
    if (!role) {
      const allEmployees = employees || [];
      console.log('No role selected, showing all employees:', allEmployees.length);
      if (!employeeSearch) return allEmployees;
      const q = employeeSearch.toLowerCase();
      const filtered = allEmployees.filter(emp => 
        emp.name.toLowerCase().includes(q) || 
        (emp.email || '').toLowerCase().includes(q)
      );
      console.log('Filtered by search:', filtered.length);
      return filtered;
    }
    
    // Filter by role if one is selected
    const pool = employees.filter(emp => 
      (emp.departments || emp.skills || []).includes(role)
    );
    console.log(`Filtered by role "${role}":`, pool.length, pool);
    
    // If no employees found for this role, show all employees as fallback
    if (pool.length === 0) {
      console.log('No employees found for role, showing all employees as fallback');
      const allEmployees = employees || [];
      if (!employeeSearch) return allEmployees;
      const q = employeeSearch.toLowerCase();
      return allEmployees.filter(emp => 
        emp.name.toLowerCase().includes(q) || 
        (emp.email || '').toLowerCase().includes(q)
      );
    }
    
    if (!employeeSearch) return pool;
    const q = employeeSearch.toLowerCase();
    const finalFiltered = pool.filter(emp => 
      emp.name.toLowerCase().includes(q) || 
      (emp.email || '').toLowerCase().includes(q)
    );
    console.log('Final filtered result:', finalFiltered.length);
    return finalFiltered;
  };

  const getEmployeeById = (id) => {
    return employees.find(emp => emp.id === id);
  };

  const getShiftsForDate = (date) => {
    return shifts.filter(shift => shift.date === format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="p-6 space-y-6">
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

             {/* Debug Info - Remove this in production */}
       {process.env.NODE_ENV === 'development' && (
         <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-sm">
           <h3 className="font-semibold mb-2">Debug Info:</h3>
           <p>Total Employees: {employees?.length || 0}</p>
           <p>Current Role: {shiftForm.role || 'None'}</p>
           <p>Eligible Employees: {getEligibleEmployees(shiftForm.role)?.length || 0}</p>
           <p>User Role: {user?.role}</p>
           <p>Current Employee: {currentEmployee ? `${currentEmployee.name} (ID: ${currentEmployee.id})` : 'Not found'}</p>
           <p>Total Shifts: {shifts?.length || 0}</p>
           <p>Visible Shifts: {visibleShifts?.length || 0}</p>
           {employees && employees.length > 0 && (
             <div className="mt-2">
               <p className="font-semibold">Available Employees:</p>
               <ul className="list-disc list-inside ml-2">
                 {employees.map(emp => (
                   <li key={emp.id}>
                     {emp.name} - Role: {emp.role} - Departments: {Array.isArray(emp.departments) ? emp.departments.join(', ') : 'None'}
                   </li>
                 ))}
               </ul>
             </div>
           )}
         </div>
       )}

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
               <p className="text-gray-500">No shifts found</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {visibleShifts.map(shift => (
                 <ShiftCard
                   key={shift.id}
                   shift={shift}
                   employee={employees.find(emp => emp.id === shift.employeeId)}
                   onEdit={(shift) => {
                     // TODO: Implement edit functionality
                     console.log('Edit shift:', shift);
                   }}
                   onDelete={handleDeleteShift}
                   onMarkAttendance={handleMarkAttendance}
                   isEditable={true}
                   showActions={true}
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
                    console.log('Rendering employee dropdown with:', { 
                      role: shiftForm.role, 
                      eligibleCount: eligibleEmployees.length, 
                      employees: eligibleEmployees 
                    });
                    
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