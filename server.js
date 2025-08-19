const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Ensure data directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log('Data directories created/verified');
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Initialize base data (minimal seed)
async function initializeBaseData() {
  const nowIso = new Date().toISOString();
  const baseUsers = [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      role: 'Admin',
      email: 'admin@company.com',
      isActive: true,
      createdAt: nowIso,
      lastLogin: null,
      permissions: ['all']
    },

  ];

  const baseEmployees = [];

  const filesAndData = [
    { name: 'users.json', data: baseUsers },
    { name: 'employees.json', data: baseEmployees },
    { name: 'departments.json', data: [] },
    { name: 'shifts.json', data: [] },
    { name: 'swap-requests.json', data: [] },
    { name: 'time-off-requests.json', data: [] },
    { name: 'payroll-records.json', data: [] },
    { name: 'notifications.json', data: [] }
  ];

  for (const { name, data } of filesAndData) {
    const filePath = path.join(DATA_DIR, name);
    try {
      await fs.access(filePath);
      console.log(`${name} already exists`);
    } catch (error) {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`Created ${name} with base data`);
    }
  }
}

// Routes for data operations
app.get('/data/:filename', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, req.params.filename);
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/data/:filename', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, req.params.filename);
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.delete('/data/:filename', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, req.params.filename);
    await fs.unlink(filePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Backup routes
app.post('/data/backups/:filename', async (req, res) => {
  try {
    const filePath = path.join(BACKUP_DIR, req.params.filename);
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Backup created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

app.get('/data/backups/:filename', async (req, res) => {
  try {
    const filePath = path.join(BACKUP_DIR, req.params.filename);
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(404).json({ error: 'Backup not found' });
  }
});

// List available backups
app.get('/data/backups', async (req, res) => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files.filter(file => file.endsWith('.json'));
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Reset data to base seed
app.post('/data/reset', async (req, res) => {
  try {
    const nowIso = new Date().toISOString();
    const baseUsers = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123',
        role: 'Admin',
        email: 'admin@company.com',
        isActive: true,
        createdAt: nowIso,
        lastLogin: null,
        permissions: ['all']
      },

    ];

    const baseEmployees = [];

    const filesAndData = [
      { name: 'users.json', data: baseUsers },
      { name: 'employees.json', data: baseEmployees },
      { name: 'departments.json', data: [] },
      { name: 'shifts.json', data: [] },
      { name: 'swap-requests.json', data: [] },
      { name: 'time-off-requests.json', data: [] },
      { name: 'payroll-records.json', data: [] },
      { name: 'notifications.json', data: [] }
    ];

    for (const { name, data } of filesAndData) {
      const filePath = path.join(DATA_DIR, name);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    res.json({ success: true, message: 'Data reset to base seed' });
  } catch (error) {
    console.error('Failed to reset data:', error);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

// Start server
async function startServer() {
  await ensureDirectories();
  await initializeBaseData();
  
  app.listen(PORT, () => {
    console.log(`Data server running on port ${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
    console.log(`Backup directory: ${BACKUP_DIR}`);
  });
}

startServer().catch(console.error);
