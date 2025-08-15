import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';

const EmployeePage = ({ user, employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const selectedEmployee = employees.find(emp => emp.id === parseInt(id));
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    role: 'Employee',
    hourlyRate: '',
    departments: [],
    availability: {
      monday: { available: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
      thursday: { available: true, startTime: '09:00', endTime: '17:00' },
      friday: { available: true, startTime: '09:00', endTime: '17:00' },
      saturday: { available: false, startTime: '09:00', endTime: '17:00' },
      sunday: { available: false, startTime: '09:00', endTime: '17:00' }
    }
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState(null);

  // Hierarchy roles - managers can't add higher than their level
  const getAvailableRoles = () => {
    const userRole = user?.role;
    if (userRole === 'Admin') {
      return ['Employee', 'Supervisor', 'Manager', 'Admin'];
    } else if (userRole === 'Manager') {
      return ['Employee', 'Supervisor'];
    } else if (userRole === 'Supervisor') {
      return ['Employee'];
    }
    return ['Employee'];
  };

  const availableDepartments = [
    'cashier', 'barista', 'kitchen', 'cleaning', 'customer-service',
    'inventory', 'food-prep', 'coffee-making', 'baking', 'management'
  ];

  useEffect(() => {
    if (selectedEmployee) {
      setFormData({
        name: selectedEmployee.name || '',
        email: selectedEmployee.email || '',
        phone: selectedEmployee.phone || '',
        emergencyContact: selectedEmployee.emergencyContact || '',
        emergencyPhone: selectedEmployee.emergencyPhone || '',
        role: selectedEmployee.role || 'Employee',
        hourlyRate: selectedEmployee.hourlyRate || '',
        departments: selectedEmployee.departments || selectedEmployee.skills || [],
        availability: selectedEmployee.availability || formData.availability
      });
    }
  }, [selectedEmployee]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEditMode) {
      onUpdateEmployee(parseInt(id), formData);
      setNotification({ type: 'success', message: 'Employee updated successfully' });
    } else {
      onAddEmployee({ ...formData, id: Date.now() });
      setNotification({ type: 'success', message: 'Employee added successfully' });
      navigate('/staff');
    }
  };

  const handleDelete = () => {
    onDeleteEmployee(parseInt(id));
    setShowDeleteConfirm(false);
    setNotification({ type: 'success', message: 'Employee deleted successfully' });
    navigate('/staff');
  };

  const toggleDepartment = (dept) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }));
  };

  const updateAvailability = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/staff')}
                className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Staff
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? 'Edit Employee' : 'Add New Employee'}
              </h1>
              <p className="text-gray-600">
                {isEditMode ? 'Update employee information' : 'Create a new employee profile'}
              </p>
            </div>
            {isEditMode && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  Delete Employee
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getAvailableRoles().map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Emergency Contact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Departments</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableDepartments.map(dept => (
                  <label key={dept} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.departments.includes(dept)}
                      onChange={() => toggleDepartment(dept)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 capitalize">{dept}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Weekly Availability</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(formData.availability).map(([day, schedule]) => (
                  <div key={day} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={schedule.available}
                          onChange={(e) => updateAvailability(day, 'available', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium capitalize">{day}</span>
                      </label>
                    </div>
                    {schedule.available && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500">Start Time</label>
                          <input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => updateAvailability(day, 'startTime', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">End Time</label>
                          <input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => updateAvailability(day, 'endTime', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/staff')}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isEditMode ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Delete Employee</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedEmployee?.name}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
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
    </div>
  );
};

export default EmployeePage; 