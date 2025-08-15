import React, { useState, useEffect } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import NotificationBanner from '../components/NotificationBanner';

const SwapShift = ({ user, employees = [] }) => {
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  const [shifts, setShifts] = useState([
    {
      id: 1,
      employeeId: 1,
      employeeName: 'Alice Johnson',
      date: '2025-08-18',
      startTime: '09:00',
      endTime: '17:00',
      role: 'barista',
      status: 'scheduled'
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: 'Bob Smith',
      date: '2025-08-19',
      startTime: '09:00',
      endTime: '17:00',
      role: 'cashier',
      status: 'scheduled'
    },
    {
      id: 3,
      employeeId: 3,
      employeeName: 'Carol Davis',
      date: '2025-08-20',
      startTime: '09:00',
      endTime: '17:00',
      role: 'kitchen',
      status: 'scheduled'
    }
  ]);

  const [swapRequests, setSwapRequests] = useState([
    {
      id: 1,
      requesterId: 1,
      requesterName: 'Alice Johnson',
      shiftId: 1,
      shiftDate: '2025-08-18',
      shiftTime: '09:00-17:00',
      reason: 'Doctor appointment',
      status: 'pending',
      createdAt: '2025-08-15T10:00:00Z'
    },
    {
      id: 2,
      requesterId: 2,
      requesterName: 'Bob Smith',
      shiftId: 2,
      shiftDate: '2025-08-19',
      shiftTime: '09:00-17:00',
      reason: 'Family emergency',
      status: 'approved',
      createdAt: '2025-08-14T14:30:00Z'
    }
  ]);

  const [timeOffRequests, setTimeOffRequests] = useState([
    {
      id: 1,
      employeeId: 1,
      employeeName: 'Alice Johnson',
      startDate: '2025-08-25',
      endDate: '2025-08-27',
      reason: 'Vacation',
      status: 'pending',
      createdAt: '2025-08-13T09:00:00Z'
    },
    {
      id: 2,
      employeeId: 3,
      employeeName: 'Carol Davis',
      startDate: '2025-08-30',
      endDate: '2025-08-30',
      reason: 'Personal day',
      status: 'approved',
      createdAt: '2025-08-12T16:00:00Z'
    }
  ]);

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [notification, setNotification] = useState(null);

  const [swapForm, setSwapForm] = useState({
    shiftId: '',
    reason: '',
    preferredSwapWith: ''
  });

  const [timeOffForm, setTimeOffForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const handleSwapRequest = () => {
    if (!swapForm.shiftId || !swapForm.reason) {
      setNotification({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    const shift = shifts.find(s => s.id === parseInt(swapForm.shiftId));
    const newRequest = {
      id: Date.now(),
      requesterId: 1, // Current user ID
      requesterName: 'Alice Johnson', // Current user name
      shiftId: parseInt(swapForm.shiftId),
      shiftDate: shift.date,
      shiftTime: `${shift.startTime}-${shift.endTime}`,
      reason: swapForm.reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setSwapRequests([...swapRequests, newRequest]);
    setShowSwapModal(false);
    setSwapForm({ shiftId: '', reason: '', preferredSwapWith: '' });
    setNotification({ type: 'success', message: 'Swap request submitted successfully' });
  };

  const handleTimeOffRequest = () => {
    if (!timeOffForm.startDate || !timeOffForm.endDate || !timeOffForm.reason) {
      setNotification({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    const newRequest = {
      id: Date.now(),
      employeeId: 1, // Current user ID
      employeeName: 'Alice Johnson', // Current user name
      startDate: timeOffForm.startDate,
      endDate: timeOffForm.endDate,
      reason: timeOffForm.reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setTimeOffRequests([...timeOffRequests, newRequest]);
    setShowTimeOffModal(false);
    setTimeOffForm({ startDate: '', endDate: '', reason: '' });
    setNotification({ type: 'success', message: 'Time-off request submitted successfully' });
  };

  const handleApproveRequest = (requestId, type) => {
    if (type === 'swap') {
      setSwapRequests(swapRequests.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      ));
    } else {
      setTimeOffRequests(timeOffRequests.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      ));
    }
    setNotification({ type: 'success', message: 'Request approved' });
  };

  const handleRejectRequest = (requestId, type) => {
    if (type === 'swap') {
      setSwapRequests(swapRequests.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' } : req
      ));
    } else {
      setTimeOffRequests(timeOffRequests.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' } : req
      ));
    }
    setNotification({ type: 'success', message: 'Request rejected' });
  };

  const getUpcomingShifts = () => {
    const today = new Date();
    return shifts.filter(shift => 
      parseISO(shift.date) >= today && shift.status === 'scheduled'
    ).slice(0, 5);
  };

  const upcomingShifts = getUpcomingShifts();

  // Filtered data for user or all for admin/manager
  const visibleSwapRequests = isAdminOrManager
    ? swapRequests
    : swapRequests.filter(req => req.requesterId === user.id);
  const visibleTimeOffRequests = isAdminOrManager
    ? timeOffRequests
    : timeOffRequests.filter(req => req.employeeId === user.id);
  const visibleUpcomingShifts = isAdminOrManager
    ? getUpcomingShifts()
    : getUpcomingShifts().filter(shift => shift.employeeId === user.id);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdminOrManager ? 'Shift Management' : 'My Swap Requests'}
          </h1>
          <p className="text-gray-600">
            {isAdminOrManager ? 'Request shift swaps and time off' : 'Request shift swaps and time off'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSwapModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Request Swap
          </button>
          <button
            onClick={() => setShowTimeOffModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Request Time Off
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdminOrManager ? 'Upcoming Shifts' : 'My Upcoming Shifts'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{visibleUpcomingShifts.length}</p>
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
              <p className="text-sm font-medium text-gray-600">
                {isAdminOrManager ? 'Pending Swaps' : 'My Pending Requests'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {visibleSwapRequests.filter(req => req.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdminOrManager ? 'Approved Requests' : 'My Approved Requests'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {visibleSwapRequests.filter(req => req.status === 'approved').length + 
                 visibleTimeOffRequests.filter(req => req.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdminOrManager ? 'Time Off Requests' : 'My Time Off Requests'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {visibleTimeOffRequests.filter(req => req.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Swap Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdminOrManager ? 'Shift Swap Requests' : 'My Swap Requests'}
            </h2>
          </div>
          <div className="p-6">
            {visibleSwapRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No swap requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleSwapRequests.map(request => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{request.requesterName}</h3>
                        <p className="text-sm text-gray-600">
                          {format(parseISO(request.shiftDate), 'MMM dd, yyyy')} • {request.shiftTime}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    {request.status === 'pending' && isAdminOrManager && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveRequest(request.id, 'swap')}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id, 'swap')}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Time Off Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdminOrManager ? 'Time Off Requests' : 'My Time Off Requests'}
            </h2>
          </div>
          <div className="p-6">
            {visibleTimeOffRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No time off requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleTimeOffRequests.map(request => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{request.employeeName}</h3>
                        <p className="text-sm text-gray-600">
                          {format(parseISO(request.startDate), 'MMM dd')} - {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    {request.status === 'pending' && isAdminOrManager && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveRequest(request.id, 'timeoff')}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id, 'timeoff')}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Shifts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isAdminOrManager ? 'Upcoming Shifts' : 'My Upcoming Shifts'}
          </h2>
        </div>
        <div className="p-6">
          {visibleUpcomingShifts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No upcoming shifts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleUpcomingShifts.map(shift => (
                <div key={shift.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{shift.employeeName}</h3>
                      <p className="text-sm text-gray-600">
                        {format(parseISO(shift.date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600">{shift.startTime} - {shift.endTime}</p>
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mt-2">
                        {shift.role}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Request Shift Swap</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Shift</label>
                <select
                  value={swapForm.shiftId}
                  onChange={(e) => setSwapForm({ ...swapForm, shiftId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a shift</option>
                  {upcomingShifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {format(parseISO(shift.date), 'MMM dd')} • {shift.startTime}-{shift.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={swapForm.reason}
                  onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain why you need to swap this shift..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSwapRequest}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowSwapModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Off Request Modal */}
      {showTimeOffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Request Time Off</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={timeOffForm.startDate}
                  onChange={(e) => setTimeOffForm({ ...timeOffForm, startDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={timeOffForm.endDate}
                  onChange={(e) => setTimeOffForm({ ...timeOffForm, endDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={timeOffForm.reason}
                  onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain the reason for your time off request..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleTimeOffRequest}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowTimeOffModal(false)}
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

export default SwapShift; 