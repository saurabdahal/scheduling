import React, { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, parseISO } from 'date-fns';
import ScheduleGrid from '../components/ScheduleGrid';
import ShiftCard from '../components/ShiftCard';
import NotificationBanner from '../components/NotificationBanner';

const Shifts = ({ user }) => {
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  const demoEmployees = [
    { id: 1, name: 'Alice Johnson', role: 'Employee', skills: ['barista', 'cashier'], hourlyRate: 18 },
    { id: 2, name: 'Bob Smith', role: 'Employee', skills: ['cashier', 'cleaning'], hourlyRate: 15 },
    { id: 3, name: 'Carol Davis', role: 'Employee', skills: ['kitchen', 'food-prep'], hourlyRate: 16 },
    { id: 4, name: 'David Wilson', role: 'Employee', skills: ['barista', 'coffee-making'], hourlyRate: 15 },
    { id: 5, name: 'Emma Brown', role: 'Employee', skills: ['cashier'], hourlyRate: 14.5 }
  ];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState(demoEmployees);

  useEffect(() => {
    setShifts(generateDemoShiftsForWeek(currentDate));
  }, [currentDate]);

  function generateDemoShiftsForWeek(dateInWeek) {
    const weekStart = new Date(dateInWeek);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const shifts = [];
    let shiftId = 1;
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      if (date.getDay() === 0) continue; // skip Sundays
      demoEmployees.forEach(emp => {
        let status = 'completed';
        if (date.getMonth() === 6 && date.getFullYear() === 2025) {
          if (date.getDate() % 3 === 0) status = 'in-progress';
          else if (date.getDate() % 2 === 0) status = 'scheduled';
        }
        shifts.push({
          id: shiftId++,
          employeeId: emp.id,
          employeeName: emp.name,
          date: date.toISOString().slice(0, 10),
          startTime: '09:00',
          endTime: '17:00',
          role: emp.skills[0],
          status,
          notes: '',
        });
      });
    }
    return shifts;
  }

  // Only show Bob's shifts for Bob, all for managers/admins
  const visibleShifts = isAdminOrManager
    ? shifts
    : shifts.filter(shift => shift.employeeId === user.id);

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [notification, setNotification] = useState(null);

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
    
    shifts.forEach(shift => {
      // Check for overlapping shifts for same employee
      const overlapping = shifts.filter(s => 
        s.id !== shift.id && 
        s.employeeId === shift.employeeId &&
        s.date === shift.date &&
        ((s.startTime < shift.endTime && s.endTime > shift.startTime) ||
         (shift.startTime < s.endTime && shift.endTime > s.startTime))
      );
      
      if (overlapping.length > 0) {
        newConflicts.push({
          type: 'overlap',
          shiftId: shift.id,
          message: `Overlapping shifts for ${employees.find(e => e.id === shift.employeeId)?.name}`
        });
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
        newConflicts.push({
          type: 'overtime',
          shiftId: shift.id,
          message: `Overtime alert: ${employees.find(e => e.id === shift.employeeId)?.name} has ${totalHours.toFixed(1)} hours`
        });
      }
    });

    setConflicts(newConflicts);
  }, [shifts, employees]);

  const handleCreateShift = () => {
    if (!shiftForm.employeeId) {
      setNotification({ type: 'error', message: 'Please select an employee' });
      return;
    }

    const newShift = {
      id: Date.now(),
      ...shiftForm,
      status: 'scheduled'
    };

    setShifts([...shifts, newShift]);
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
  };

  const handleUpdateShift = (updatedShift) => {
    setShifts(shifts.map(s => s.id === updatedShift.id ? updatedShift : s));
    setNotification({ type: 'success', message: 'Shift updated successfully' });
  };

  const handleDeleteShift = (shiftId) => {
    setShifts(shifts.filter(s => s.id !== shiftId));
    setNotification({ type: 'success', message: 'Shift deleted successfully' });
  };

  const handleMarkAttendance = (shiftId, status) => {
    setShifts(shifts.map(s => s.id === shiftId ? { ...s, status } : s));
    setNotification({ type: 'success', message: `Shift marked as ${status}` });
  };

  const getEligibleEmployees = (role) => {
    return employees.filter(emp => emp.skills.includes(role));
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

      {/* Shift Creation Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Shift</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <select
                  value={shiftForm.employeeId}
                  onChange={(e) => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
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
                  onChange={(e) => setShiftForm({ ...shiftForm, role: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cashier">Cashier</option>
                  <option value="barista">Barista</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="manager">Manager</option>
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