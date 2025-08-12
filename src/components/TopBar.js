import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const TopBar = ({ onLogout, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef();
  
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  
  const menuItems = [
    { to: '/dashboard', label: 'Dashboard' },
    ...(isAdminOrManager ? [{ to: '/staff', label: 'Staff' }] : []),
    { to: '/timesheet', label: isAdminOrManager ? 'Timesheet' : 'My Timesheet' },
    { to: '/shifts', label: isAdminOrManager ? 'Shifts' : 'My Schedule' },
    { to: '/swap-shift', label: 'Swap Shift' },
    { to: '/payroll', label: 'Payroll' },
  ];

  useEffect(() => {
    if (!userDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdown]);

  return (
    <nav className="bg-blue-800 text-white px-4 py-3 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="font-extrabold text-2xl tracking-tight text-white">StaffManager</span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2 lg:gap-6">
          {menuItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-2 rounded-md font-medium transition-colors duration-150 ${location.pathname === item.to ? 'bg-blue-900 text-white' : 'hover:bg-blue-700 hover:text-white text-blue-100'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Dropdown */}
        <div className="relative flex items-center gap-2" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdown(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <span className="hidden sm:inline text-sm font-medium block">{user?.role}</span>
            <span className="hidden sm:inline text-xs font-normal text-blue-100 block mt-0.5">{user?.username}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {userDropdown && (
            <div className="absolute left-0 right-auto mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-50 animate-fade-in" style={{ minWidth: '180px', top: '100%' }}>
              <div className="px-4 py-2 border-b text-xs text-gray-500">Signed in as <span className="font-semibold">{user?.username}</span></div>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-red-600 font-medium rounded-b"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden ml-2 p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => setMenuOpen(v => !v)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-2 bg-blue-700 rounded-lg shadow-lg animate-fade-in">
          <div className="flex flex-col gap-1 py-2">
            {menuItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-150 ${location.pathname === item.to ? 'bg-blue-900 text-white' : 'hover:bg-blue-800 hover:text-white text-blue-100'}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 mt-2 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopBar; 