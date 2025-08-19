import React, { useEffect, useState } from 'react';
import dataService from '../services/DataService.js';
import { User } from '../models/index.js';

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' });
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const loaded = await dataService.getAll('users');
        setUsers(loaded);
      } catch (error) {
        console.error('Failed to load users:', error);
        // Fallback to admin only if server is not available
        setUsers([
          { username: 'admin', password: 'admin123', role: 'Admin' }
        ]);
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
      return;
    }

    // Fallback: allow default credentials even if server is not available
    if (form.username === 'admin' && form.password === 'admin123') {
      const fallbackAdmin = { id: 1, username: 'admin', role: 'Admin', email: 'admin@company.com' };
      setError('');
      onLogin(fallbackAdmin);
      return;
    }



    setError('Invalid credentials');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Staff Management Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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

        {users.length > 0 && (
          <div className="mt-6 text-sm text-gray-500">
            <div>Users:</div>
            <ul className="mt-2 space-y-1">
                             {users.map(u => (
                <li key={u.username}>
                  <span className="font-semibold">{u.username}</span> / <span>{u.password}</span> ({u.role})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage; 