import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, parseISO, addWeeks, subWeeks, startOfMonth, endOfMonth, addDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shift, PayrollRecord, User, Notification } from '../models/index.js';
import dataService from '../services/DataService.js';

const Payroll = ({ user, employees = [], shifts = [], payrollRecords = [], onUpdatePayrollRecords }) => {
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  // Employees and shifts now come from props (App state)

  const [selectedEmployees, setSelectedEmployees] = useState(() => {
    if (isAdminOrManager) {
      return employees.map(emp => emp.id);
    } else {
      return user?.id ? [user.id] : [];
    }
  });
  const [payrollPeriod, setPayrollPeriod] = useState('week');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  });
  const [payrollData, setPayrollData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [noShiftsFound, setNoShiftsFound] = useState(false);

  // Debug: Log shifts when component mounts
  useEffect(() => {
    console.log('Loaded shifts:', shifts);
    console.log('Current date range:', getDateRange());
    console.log('Selected employees:', selectedEmployees);
    
    // Auto-generate payroll data for the current week
    if (selectedEmployees.length > 0) {
      generatePayroll();
    }
  }, [selectedEmployees]);

  // Auto-generate payroll when date range changes
  useEffect(() => {
    if (selectedEmployees.length > 0) {
      console.log('Date range changed, regenerating payroll...');
      generatePayroll();
    }
  }, [payrollPeriod, customDateRange]);

  // Calculate hours worked
  const calculateHours = (startTime, endTime) => {
    const start = parseISO(`2000-01-01T${startTime}`);
    const end = parseISO(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  };

  // Get date range based on period selection
  const getDateRange = () => {
    const today = new Date();
    
    switch (payrollPeriod) {
      case 'week':
        return {
          startDate: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      case 'biweekly':
        const twoWeeksAgo = subWeeks(today, 2);
        return {
          startDate: format(startOfWeek(twoWeeksAgo, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      case 'month':
        return {
          startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(today), 'yyyy-MM-dd')
        };
      case 'custom':
        return customDateRange;
      default:
        return {
          startDate: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
    }
  };

  // Generate payroll data
  const generatePayroll = () => {
    if (selectedEmployees.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one employee' });
      return;
    }
    setIsGenerating(true);
    const dateRange = getDateRange();
    const payroll = selectedEmployees.map(employeeId => {
      const employee = employees.find(e => e.id === employeeId);
      const employeeShifts = shifts.filter(shift =>
        shift.employeeId === employeeId &&
        parseISO(shift.date) >= parseISO(dateRange.startDate) &&
        parseISO(shift.date) <= parseISO(dateRange.endDate) &&
        shift.status === 'completed'
      );
      
      // Create payroll record using the model
      const payrollRecord = new PayrollRecord({
        employeeId: employee.id,
        employeeName: employee.name,
        payPeriodStart: dateRange.startDate,
        payPeriodEnd: dateRange.endDate,
        hourlyRate: employee.hourlyRate,
        shifts: employeeShifts
      });
      
      // Calculate payroll from shifts using model method
      payrollRecord.calculateFromShifts(employeeShifts);
      
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        hourlyRate: employee.hourlyRate,
        totalHours: payrollRecord.totalHours,
        regularHours: payrollRecord.regularHours,
        overtimeHours: payrollRecord.overtimeHours,
        regularPay: payrollRecord.regularPay,
        overtimePay: payrollRecord.overtimePay,
        totalPay: payrollRecord.totalPay,
        shifts: employeeShifts.length,
        dailyData: employeeShifts.map(shift => {
          const hours = shift.getActualDuration() || shift.getDuration();
          return {
            date: shift.date,
            day: format(parseISO(shift.date), 'EEE'),
            start: shift.actualStartTime || shift.startTime,
            end: shift.actualEndTime || shift.endTime,
            hours: hours.toFixed(2),
            pay: `$${(hours * employee.hourlyRate).toFixed(2)}`
          };
        })
      };
    });
    setPayrollData(payroll);
    setIsGenerating(false);
    setNoShiftsFound(payroll.every(emp => emp.shifts === 0));
    setNotification({ type: 'success', message: 'Payroll generated successfully' });
    
    // Create notification for payroll ready
    if (payroll.length > 0) {
      const notification = Notification.createPayrollReady(
        payroll[0].employeeName,
        `${dateRange.startDate} to ${dateRange.endDate}`
      );
      console.log('Payroll ready notification:', notification.toJSON());
    }
  };

  // Generate PDF
  const generatePDF = () => {
    if (payrollData.length === 0) {
      setNotification({ type: 'error', message: 'Please generate payroll data first' });
      return;
    }

    const dateRange = getDateRange();
    // Calculate summary values ONCE at the top
    const totalPayroll = payrollData.reduce((total, emp) => total + emp.totalPay, 0);
    const totalHours = payrollData.reduce((total, emp) => total + emp.totalHours, 0);
    const totalRegularPay = payrollData.reduce((total, emp) => total + emp.regularPay, 0);
    const totalOvertimePay = payrollData.reduce((total, emp) => total + emp.overtimePay, 0);
    const filename = `payroll-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
    getBase64FromImageUrl(process.env.PUBLIC_URL + '/Tim-Hortons-logo.png', (logoDataUrl) => {
      const doc = new jsPDF();
      // Add logo
      doc.addImage(logoDataUrl, 'PNG', 80, 10, 50, 20);
      let y = 45; // More space after logo
      doc.setFontSize(22);
      doc.text('Payroll Report', 105, y, { align: 'center' });
      y += 12;
      doc.setFontSize(12);
      doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 105, y, { align: 'center' });
      y += 10;
      // Add some spacing
      y += 5;

      // Helper to get week start/end
      function getWeekRange(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diffToMonday = (day + 6) % 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return [monday, sunday];
      }

      // Split the date range into weeks
      let start = new Date(dateRange.startDate);
      let end = new Date(dateRange.endDate);
      let weekStarts = [];
      let curr = new Date(start);
      curr.setHours(0,0,0,0);
      while (curr <= end) {
        weekStarts.push(new Date(curr));
        curr.setDate(curr.getDate() + 7);
      }
      // For each week, create a table
      weekStarts.forEach((weekStart, i) => {
        if (i > 0) doc.addPage();
        let weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) weekEnd = end;
        doc.setFontSize(14);
        doc.text(`Week ${i+1}: ${weekStart.toISOString().slice(0,10)} to ${weekEnd.toISOString().slice(0,10)}`, 14, 35);
        y = 45;
        payrollData.forEach(emp => {
          // Filter shifts for this week
          const weekShifts = emp.dailyData.filter(row => {
            const d = new Date(row.date);
            return d >= weekStart && d <= weekEnd;
          });
          if (weekShifts.length === 0) return;
          doc.setFontSize(12);
          // Use employeeName and fallback for role
          const role = emp.role || 'Employee';
          doc.text(`${emp.employeeName} (${role})`, 14, y);
          y += 6;
          // Table header and rows
          const tableBody = weekShifts.map(row => [row.date, row.day, row.start, row.end, row.hours, row.pay]);
          // Only add summary row if there are actual shifts
          if (weekShifts.length > 0) {
            const totalHours = weekShifts.reduce((sum, row) => sum + parseFloat(row.hours), 0);
            const totalPay = weekShifts.reduce((sum, row) => sum + parseFloat(row.pay.replace('$','')), 0);
            tableBody.push(['Total', '', '', '', totalHours.toFixed(2), `$${totalPay.toFixed(2)}`]);
          }
          // Only render the table if there are rows (including summary)
          if (tableBody.length > 0) {
            autoTable(doc, {
              startY: y,
              head: [['Date', 'Day', 'Start', 'End', 'Hours', 'Pay']],
              body: tableBody,
              theme: 'grid',
              styles: { fontSize: 10 },
              headStyles: { fillColor: [124, 63, 0], textColor: 255 }, // Tim Hortons brown
              margin: { left: 14, right: 14 },
            });
            y = doc.lastAutoTable.finalY + 10;
            doc.setDrawColor(200);
            doc.line(14, y-4, 196, y-4); // separator
            y += 2;
          }
        });
        // Footer for each page
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.setTextColor(120, 63, 4);
        doc.text('Confidential - For Tim Hortons Downtown Sudbury Only', 105, pageHeight - 15, { align: 'center' });
        doc.setTextColor(100, 100, 100);
        doc.text('Contact: 123 Elm St, Sudbury, ON | (555) 123-4567', 105, pageHeight - 8, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      });
      // Add a summary table for the selected range
      doc.addPage();
      let summaryY = 45;
      doc.setFontSize(16);
      doc.text(`Payroll Summary: ${dateRange.startDate} to ${dateRange.endDate}`, 105, summaryY, { align: 'center' });
      summaryY += 10;
      autoTable(doc, {
        startY: summaryY,
        head: [['Metric', 'Amount']],
        body: [
          ['Total Hours Worked', `${totalHours.toFixed(2)} h`],
          ['Total Regular Pay', `$${totalRegularPay.toFixed(2)}`],
          ['Total Overtime Pay', `$${totalOvertimePay.toFixed(2)}`],
          ['Total Payroll', `$${totalPayroll.toFixed(2)}`],
        ],
        theme: 'grid',
        styles: { fontSize: 12 },
        headStyles: { fillColor: [124, 63, 0], textColor: 255 },
        margin: { left: 30, right: 30 },
      });
      doc.save(filename);
      setNotification({ type: 'success', message: 'Payroll report downloaded as PDF' });
    });
  };

  // Handle employee selection
  const handleEmployeeSelection = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  // Select all employees
  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  // Helper to convert image URL to base64
  function getBase64FromImageUrl(url, callback) {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      callback(dataURL);
    };
    img.src = url;
  }

  useEffect(() => {
    if (notification && notification.type === 'success') {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (!isAdminOrManager && user?.id) {
      setSelectedEmployees([user.id]);
    }
  }, [isAdminOrManager, user]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Generate and manage employee payroll reports</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generatePayroll}
            disabled={isGenerating || selectedEmployees.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Payroll'}
          </button>
          <button
            onClick={generatePDF}
            disabled={payrollData.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Current Date Range Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-blue-800">Current Payroll Period:</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-blue-900">
              {format(parseISO(getDateRange().startDate), 'MMM dd, yyyy')} - {format(parseISO(getDateRange().endDate), 'MMM dd, yyyy')}
            </div>
            <div className="text-sm text-blue-700">
              {payrollPeriod === 'week' ? 'This Week' : 
               payrollPeriod === 'biweekly' ? 'Bi-Weekly' : 
               payrollPeriod === 'month' ? 'This Month' : 'Custom Range'}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{employees.length}</p>
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
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-2xl font-semibold text-gray-900">{selectedEmployees.length}</p>
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
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {payrollData.length > 0 ? payrollData.reduce((total, emp) => total + emp.totalHours, 0).toFixed(1) : '0'}h
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payroll</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${payrollData.length > 0 ? payrollData.reduce((total, emp) => total + emp.totalPay, 0).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Period Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payroll Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period Type</label>
            <select
              value={payrollPeriod}
              onChange={(e) => setPayrollPeriod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {payrollPeriod === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              {payrollPeriod !== 'custom' && (
                <span>
                  {format(parseISO(getDateRange().startDate), 'MMM dd, yyyy')} - {format(parseISO(getDateRange().endDate), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Select Employees</h2>
          <div className="flex space-x-2">
            <button
              onClick={selectAllEmployees}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map(employee => (
            <div
              key={employee.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedEmployees.includes(employee.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleEmployeeSelection(employee.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.role}</p>
                </div>
                <div className={`w-5 h-5 rounded border-2 ${
                  selectedEmployees.includes(employee.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedEmployees.includes(employee.id) && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">${employee.hourlyRate}/hr</p>
                <p className="text-xs text-gray-500">{employee.email}</p>
                <p className="text-xs text-gray-500">{employee.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payroll Results */}
      {payrollData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payroll Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regular</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pay</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollData.map((emp) => (
                  <tr key={emp.employeeId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{emp.employeeName}</div>
                      <div className="text-sm text-gray-500">{emp.shifts} shifts</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${emp.hourlyRate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.totalHours.toFixed(1)}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${emp.regularPay.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${emp.overtimePay.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${emp.totalPay.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">Total Payroll:</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ${payrollData.reduce((total, emp) => total + emp.totalPay, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Empty State Message */}
      {payrollData.length === 0 && selectedEmployees.length > 0 && !noShiftsFound && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-blue-900 mb-2">Ready to Generate Payroll</h3>
          <p className="text-blue-700 mb-4">
            Click "Generate Payroll" to calculate pay for the selected employees and period.
          </p>
          <div className="text-sm text-blue-600">
            <p>Current period: {format(parseISO(getDateRange().startDate), 'MMM dd, yyyy')} - {format(parseISO(getDateRange().endDate), 'MMM dd, yyyy')}</p>
            <p>Selected employees: {selectedEmployees.length}</p>
          </div>
        </div>
      )}

      {/* No Employees Selected Message */}
      {selectedEmployees.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">No Employees Selected</h3>
          <p className="text-yellow-700 mb-4">
            Please select at least one employee to generate payroll data.
          </p>
          <button
            onClick={selectAllEmployees}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Select All Employees
          </button>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {noShiftsFound && (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4 text-center">
          No shifts found for the selected period. Try a different range or select more employees.
        </div>
      )}
    </div>
  );
};

export default Payroll;
