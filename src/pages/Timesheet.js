import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, parseISO, addWeeks, subWeeks } from 'date-fns';
import ShiftCard from '../components/ShiftCard';
import NotificationBanner from '../components/NotificationBanner';

import dataService from '../services/DataService.js';
import { populateEmployeeNames } from '../models/utils.js';

const Timesheet = ({ user, employees = [], shifts = [], onUpdateShifts }) => {
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  const [currentDate, setCurrentDate] = useState(new Date());
  // Shifts and employees come from props; no local demo state

  // Find the employee record for the logged-in user
  const currentEmployee = employees.find(emp => emp.email === user.email || emp.userId === user.id);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(() => {
    if (!isAdminOrManager && currentEmployee) return currentEmployee.id.toString();
    return 'all';
  });
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({
    startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  });
  const [notification, setNotification] = useState(null);
  
  // Add state for edit and delete confirmation
  const [editingShift, setEditingShift] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // No demo shift generation; this page only displays shifts it receives

  // Populate employee names for all shifts to fix "Unknown Employee" issue
  const shiftsWithEmployeeNames = populateEmployeeNames(shifts, employees);
  
  const filteredShifts = isAdminOrManager
    ? shiftsWithEmployeeNames.filter(shift =>
        (selectedEmployeeId === 'all' || shift.employeeId === parseInt(selectedEmployeeId)) &&
        (selectedStatus === 'all' || shift.status === selectedStatus)
      )
    : shiftsWithEmployeeNames.filter(shift =>
        shift.employeeId === currentEmployee?.id &&
        (selectedStatus === 'all' || shift.status === selectedStatus)
      );

  const summaryEmployees = isAdminOrManager
    ? employees
    : employees.filter(e => e.id === currentEmployee?.id);
    


  const calculateHours = (startTime, endTime) => {
    const start = parseISO(`2000-01-01T${startTime}`);
    const end = parseISO(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  };

  const calculateTotalHours = (employeeId) => {
    const employeeShifts = filteredShifts.filter(shift => shift.employeeId === employeeId);
    return employeeShifts.reduce((total, shift) => {
      return total + calculateHours(shift.actualStartTime || shift.startTime, shift.actualEndTime || shift.endTime);
    }, 0);
  };

  const calculateTotalWages = (employeeId) => {
    const employee = summaryEmployees.find(emp => emp.id === employeeId);
    if (!employee) return 0;
    return calculateTotalHours(employeeId) * employee.hourlyRate;
  };

  const handleMarkAttendance = async (shiftId, status) => {
    try {
      const updated = shifts.map(shift => shift.id === shiftId ? { ...shift, status } : shift);
      const shift = updated.find(s => s.id === shiftId);
      if (shift) {
        await dataService.saveShift(shift);
      }
      onUpdateShifts(updated);
      setNotification({ type: 'success', message: `Shift marked as ${status}` });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update shift' });
    }
  };



  // Handle edit shift
  const handleEditShift = (shift) => {
    if (!isAdminOrManager) {
      setNotification({ type: 'error', message: 'You do not have permission to edit shifts' });
      return;
    }
    setEditingShift(shift);
    // Navigate to shifts page for editing
    window.location.href = `/shifts?edit=${shift.id}`;
  };

  // Handle delete shift with confirmation
  const handleDeleteShift = (shiftId) => {
    if (!isAdminOrManager) {
      setNotification({ type: 'error', message: 'You do not have permission to delete shifts' });
      return;
    }
    setShiftToDelete(shiftId);
    setShowDeleteConfirm(true);
  };

  // Confirm delete shift
  const confirmDeleteShift = async () => {
    if (!shiftToDelete) return;
    
    try {
      console.log('Timesheet: Attempting to delete shift:', shiftToDelete);
      const result = await dataService.delete('shifts', shiftToDelete);
      console.log('Timesheet: Delete result:', result);
      
      if (result) {
        const updatedShifts = shifts.filter(s => s.id !== shiftToDelete);
        onUpdateShifts(updatedShifts);
        setNotification({ type: 'success', message: 'Shift deleted successfully' });
      } else {
        throw new Error('Delete operation returned false');
      }
    } catch (error) {
      console.error('Timesheet: Error deleting shift:', error);
      setNotification({ type: 'error', message: `Failed to delete shift: ${error.message}` });
    } finally {
      setShowDeleteConfirm(false);
      setShiftToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setShiftToDelete(null);
  };

  const generateReport = () => {
    let reportData;
    if (isAdminOrManager) {
      reportData = summaryEmployees.map(employee => {
        const employeeShifts = filteredShifts.filter(shift => 
          shift.employeeId === employee.id &&
          parseISO(shift.date) >= parseISO(reportDateRange.startDate) &&
          parseISO(shift.date) <= parseISO(reportDateRange.endDate)
        );
        const totalHours = employeeShifts.reduce((total, shift) => {
          return total + calculateHours(shift.actualStartTime || shift.startTime, shift.actualEndTime || shift.endTime);
        }, 0);
        return {
          employee: employee.name,
          totalHours,
          hourlyRate: employee.hourlyRate,
          totalWages: totalHours * employee.hourlyRate,
          shifts: employeeShifts.length
        };
      });
    } else {
      // Employee: only their own data
      const employee = employees.find(e => e.id === user.id);
      const employeeShifts = filteredShifts.filter(shift => 
        shift.employeeId === user.id &&
        parseISO(shift.date) >= parseISO(reportDateRange.startDate) &&
        parseISO(shift.date) <= parseISO(reportDateRange.endDate)
      );
      const totalHours = employeeShifts.reduce((total, shift) => {
        return total + calculateHours(shift.actualStartTime || shift.startTime, shift.actualEndTime || shift.endTime);
      }, 0);
      reportData = [{
        employee: employee?.name || user.username,
        totalHours,
        hourlyRate: employee?.hourlyRate || '',
        totalWages: totalHours * (employee?.hourlyRate || 0),
        shifts: employeeShifts.length
      }];
    }

    // Create CSV content
    const csvContent = [
      ['Employee', 'Total Hours', 'Hourly Rate', 'Total Wages', 'Shifts'],
      ...reportData.map(row => [
        row.employee,
        row.totalHours,
        `$${row.hourlyRate}`,
        `$${row.totalWages.toFixed(2)}`,
        row.shifts
      ])
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-report-${reportDateRange.startDate}-to-${reportDateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setShowReportModal(false);
    setNotification({ type: 'success', message: 'Report generated and downloaded' });
  };

  const getStatusStats = () => {
    const stats = {
      completed: filteredShifts.filter(s => s.status === 'completed').length,
      inProgress: filteredShifts.filter(s => s.status === 'in-progress').length,
      scheduled: filteredShifts.filter(s => s.status === 'scheduled').length,
      noShow: filteredShifts.filter(s => s.status === 'no-show').length
    };
    return stats;
  };

  const statusStats = getStatusStats();

  return (
    <div className="p-6 space-y-6">

      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdminOrManager ? 'Timesheet' : 'My Timesheet'}
          </h1>
          <p className="text-gray-600">
            {isAdminOrManager ? 'Track hours worked and generate payment reports' : 'View your hours and earnings'}
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
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next Week
          </button>
          {(isAdminOrManager || user?.role === 'Employee') && (
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Generate Report
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{statusStats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{statusStats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-semibold text-gray-900">{statusStats.scheduled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">No Shows</p>
              <p className="text-2xl font-semibold text-gray-900">{statusStats.noShow}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdminOrManager && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Employees</option>
                {summaryEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedEmployeeId('all');
                setSelectedStatus('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Shifts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Shifts ({filteredShifts.length})</h2>
        </div>
        <div className="p-6">
          {filteredShifts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">No shifts found for the selected criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {filteredShifts.map(shift => (
                 <ShiftCard
                   key={shift.id}
                   shift={shift}
                   employee={summaryEmployees.find(emp => emp.id === shift.employeeId)}
                   onEdit={handleEditShift}
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

      {/* Employee Summary */}
      {selectedEmployeeId === 'all' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Employee Summary</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Wages</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaryEmployees.map(employee => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{calculateTotalHours(employee.id)}h</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${employee.hourlyRate}/hr</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${calculateTotalWages(employee.id).toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Generate Payment Report</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={reportDateRange.startDate}
                  onChange={(e) => setReportDateRange({ ...reportDateRange, startDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={reportDateRange.endDate}
                  onChange={(e) => setReportDateRange({ ...reportDateRange, endDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={generateReport}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Generate CSV
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Shift</h2>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete this shift? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteShift}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Shift
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
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

export default Timesheet; 