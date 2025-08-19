import React, { useState, useRef } from 'react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';

const ScheduleGrid = ({ 
  shifts = [], 
  employees = [], 
  onShiftUpdate, 
  onShiftCreate, 
  onShiftDelete,
  currentDate = new Date() 
}) => {
  const [draggedShift, setDraggedShift] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const gridRef = useRef(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 24-hour slots

  const handleDragStart = (e, shift) => {
    setDraggedShift(shift);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, day, timeSlot) => {
    e.preventDefault();
    setDragOverSlot({ day, timeSlot });
  };

  const handleDrop = (e, day, timeSlot) => {
    e.preventDefault();
    if (draggedShift && onShiftUpdate) {
      // Pass the updated properties to the parent component
      // The parent will handle creating/updating the Shift model instance
      const updatedProperties = {
        id: draggedShift.id,
        date: format(day, 'yyyy-MM-dd'),
        startTime: `${timeSlot.toString().padStart(2, '0')}:00`,
        endTime: `${(timeSlot + 2).toString().padStart(2, '0')}:00` // Default 2-hour shift
      };
      onShiftUpdate(updatedProperties);
    }
    setDraggedShift(null);
    setDragOverSlot(null);
  };

  const getShiftsForSlot = (day, timeSlot) => {
    return shifts.filter(shift => {
      const shiftDate = format(parseISO(shift.date), 'yyyy-MM-dd');
      const dayStr = format(day, 'yyyy-MM-dd');
      const shiftStart = parseInt(shift.startTime.split(':')[0]);
      return shiftDate === dayStr && shiftStart === timeSlot;
    });
  };

  const getEmployeeName = (shift) => {
    // First check if the shift has the employee name directly
    if (shift.employeeName) {
      return shift.employeeName;
    }
    
    // Fall back to looking up the employee by ID
    const employee = employees.find(emp => emp.id === shift.employeeId);
    return employee ? employee.name : `Employee ${shift.employeeId}`;
  };

  const getRoleColor = (role) => {
    const colors = {
      'cashier': 'bg-blue-100 border-blue-300',
      'barista': 'bg-green-100 border-green-300',
      'manager': 'bg-purple-100 border-purple-300',
      'kitchen': 'bg-orange-100 border-orange-300',
      'default': 'bg-gray-100 border-gray-300'
    };
    return colors[role] || colors.default;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Weekly Schedule</h2>
        <p className="text-sm text-gray-600">
          {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 6), 'MMM dd, yyyy')}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <div ref={gridRef} className="min-w-[800px]">
          {/* Header row with days */}
          <div className="grid grid-cols-8 border-b bg-gray-50">
            <div className="p-3 font-semibold text-gray-700 border-r">Time</div>
            {weekDays.map(day => (
              <div key={day} className="p-3 font-semibold text-gray-700 border-r text-center">
                <div className="text-sm">{format(day, 'EEE')}</div>
                <div className="text-xs text-gray-500">{format(day, 'MMM dd')}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {timeSlots.map(timeSlot => (
            <div key={timeSlot} className="grid grid-cols-8 border-b hover:bg-gray-50">
              <div className="p-2 text-xs text-gray-500 border-r flex items-center justify-center">
                {timeSlot.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map(day => (
                <div
                  key={`${day}-${timeSlot}`}
                  className="p-1 border-r min-h-[60px] relative"
                  onDragOver={(e) => handleDragOver(e, day, timeSlot)}
                  onDrop={(e) => handleDrop(e, day, timeSlot)}
                >
                  {getShiftsForSlot(day, timeSlot).map(shift => (
                    <div
                      key={shift.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, shift)}
                      className={`${getRoleColor(shift.role)} p-2 rounded border text-xs cursor-move hover:shadow-md transition-shadow`}
                    >
                      <div className="font-medium">{getEmployeeName(shift)}</div>
                      <div className="text-xs opacity-75">{shift.role}</div>
                      <div className="text-xs opacity-75">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                  ))}
                  {dragOverSlot?.day === day && dragOverSlot?.timeSlot === timeSlot && (
                    <div className="absolute inset-0 bg-blue-200 opacity-50 border-2 border-dashed border-blue-400 rounded"></div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid; 