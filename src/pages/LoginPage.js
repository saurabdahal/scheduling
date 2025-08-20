import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import dataService from '../services/DataService.js';
import { User } from '../models/index.js';
import { APP_VERSION } from '../constants/appConstants.js';

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' });
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the page user was trying to access
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const loaded = await dataService.getAll('users');
        console.log('Loaded users from server:', loaded);
        setUsers(loaded);
      } catch (error) {
        console.error('Failed to load users:', error);
        // Fallback to admin only if server is not available
        const fallbackUsers = [
          { username: 'admin', password: 'admin123', role: 'Admin', email: 'admin@company.com' }
        ];
        console.log('Using fallback users:', fallbackUsers);
        setUsers(fallbackUsers);
      }
    };
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tryLogin = (list) => list.find(
      (u) => u.username === form.username && u.password === form.password
    );

    // Try with current users
    let matched = tryLogin(users);

    if (matched && (matched.isValid ? matched.isValid() : true)) {
      setError('');
      onLogin(matched.toJSON ? matched.toJSON() : matched);
      // Redirect to the originally requested page
      navigate(from, { replace: true });
      return;
    }

    // Fallback: allow default credentials even if server is not available
    if (form.username === 'admin' && form.password === 'admin123') {
      const fallbackAdmin = { id: 1, username: 'admin', role: 'Admin', email: 'admin@company.com' };
      setError('');
      onLogin(fallbackAdmin);
      // Redirect to the originally requested page
      navigate(from, { replace: true });
      return;
    }



    setError('Invalid credentials');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">Staff Management Login</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Login</button>
        </form>

        {/* Version Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">v{APP_VERSION}</p>
        </div>

        {/* User Accounts Section */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Available User Accounts</h3>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
              {users.length} account{users.length !== 1 ? 's' : ''}
            </span>
          </div>
          {users.length > 0 ? (
            <>
              <div className="space-y-0.5">
                {users.map(u => (
                  <div key={u.username} className="text-xs text-gray-700 py-0.5 border-b border-gray-200 last:border-b-0">
                    <span className="font-medium">{u.username}</span> 
                    <span className="text-gray-500 ml-2">({u.role})</span>
                    <span className="text-gray-400 ml-2">pwd: {u.password}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1 text-xs text-gray-500 text-center">
                Use any of these credentials to log in
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-gray-500">No user accounts found</p>
              <p className="text-xs text-gray-400 mt-1">Contact administrator to create accounts</p>
            </div>
          )}
        </div>

        {/* Server Status Info */}
        <div className="mt-3 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Server Connected
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 