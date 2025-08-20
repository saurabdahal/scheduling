import React from 'react';
import { format, parseISO } from 'date-fns';
import { Shift } from '../models/index.js';

const ShiftCard = ({ 
  shift, 
  employee, 
  onEdit, 
  onDelete, 
  onMarkAttendance,
  isEditable = true,
  showActions = true,
  currentUser = null
}) => {
  const getRoleColor = (role) => {
    const colors = {
      'cashier': 'bg-blue-100 text-blue-800 border-blue-200',
      'barista': 'bg-green-100 text-green-800 border-green-200',
      'manager': 'bg-purple-100 text-purple-800 border-purple-200',
      'kitchen': 'bg-orange-100 text-orange-800 border-orange-200',
      'default': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role] || colors.default;
  };

  const getStatusColor = (status) => {
    // Use the Shift model's status color method if available
    if (shift && typeof shift.getStatusColor === 'function') {
      return shift.getStatusColor();
    }
    
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'no-show': 'bg-red-100 text-red-800',
      'late': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || colors.scheduled;
  };

  const formatTime = (time) => {
    return format(parseISO(`2000-01-01T${time}`), 'h:mm a');
  };

  const formatDate = (date) => {
    return format(parseISO(date), 'MMM dd, yyyy');
  };

  const getShiftDuration = () => {
    // Use the Shift model's duration method if available
    if (shift && typeof shift.getDuration === 'function') {
      return `${shift.getDuration().toFixed(1)}h`;
    }
    
    const start = parseISO(`2000-01-01T${shift.startTime}`);
    const end = parseISO(`2000-01-01T${shift.endTime}`);
    const diffMs = end - start;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
    return `${diffHours}h`;
  };

  // Check if current user can edit/delete this shift
  const canEditShift = () => {
    if (!currentUser) return false;
    
    // Admins and Managers can edit any shift
    if (currentUser.role === 'Admin' || currentUser.role === 'Manager') {
      return true;
    }
    
    // Employees cannot edit any shifts (including their own)
    return false;
  };

  // Check if current user can mark attendance (start/end shift)
  const canMarkAttendance = () => {
    if (!currentUser) return false;
    
    // Admins and Managers can mark attendance for any shift
    if (currentUser.role === 'Admin' || currentUser.role === 'Manager') {
      return true;
    }
    
    // Employees can only mark attendance for their own shifts
    // We need to find the employee record for the current user
    // This should be passed from the parent component
    if (currentUser.role === 'Employee') {
      // For now, allow all employees to mark attendance
      // The actual permission check is done in the parent component
      return true;
    }
    
    return false;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">
            {employee?.name || 'Unassigned'}
          </h3>
          <p className="text-sm text-gray-600">{employee?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(shift.role)}`}>
            {shift.role}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shift.status)}`}>
            {shift.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
          <p className="font-medium text-gray-900">{formatDate(shift.date)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
          <p className="font-medium text-gray-900">{getShiftDuration()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Start Time</p>
          <p className="font-medium text-gray-900">{formatTime(shift.startTime)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">End Time</p>
          <p className="font-medium text-gray-900">{formatTime(shift.endTime)}</p>
        </div>
      </div>

      {shift.notes && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{shift.notes}</p>
        </div>
      )}

      {showActions && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {shift.status === 'scheduled' && canMarkAttendance() && (
              <button
                onClick={() => onMarkAttendance && onMarkAttendance(shift.id, 'in-progress')}
                className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
              >
                Start Shift
              </button>
            )}
            {shift.status === 'in-progress' && canMarkAttendance() && (
              <button
                onClick={() => onMarkAttendance && onMarkAttendance(shift.id, 'completed')}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                End Shift
              </button>
            )}
          </div>
          
          {canEditShift() && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit && onEdit(shift)}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete && onDelete(shift.id)}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShiftCard; 