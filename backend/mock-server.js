const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { id: '1', email, name },
    token: 'mock-jwt-token-123'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({
    success: true,
    message: 'Login successful',
    data: { id: '1', email, name: 'John Doe' },
    token: 'mock-jwt-token-123'
  });
});

// Leads endpoints
app.get('/api/leads', (_req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: 'Acme Corp', email: 'contact@acme.com', phone: '555-0001', company: 'Acme', status: 'new', value: 50000, createdAt: '2024-01-15', updatedAt: '2024-01-15', ownerId: 'user-1', teamId: 'team-1' },
      { id: '2', name: 'Tech Startup', email: 'info@techstartup.com', phone: '555-0002', company: 'TechStart', status: 'qualified', value: 75000, createdAt: '2024-01-10', updatedAt: '2024-01-18', ownerId: 'user-1', teamId: 'team-1' },
      { id: '3', name: 'Enterprise Ltd', email: 'sales@enterprise.com', phone: '555-0003', company: 'Enterprise', status: 'negotiating', value: 150000, createdAt: '2024-01-05', updatedAt: '2024-01-19', ownerId: 'user-2', teamId: 'team-1' },
      { id: '4', name: 'Global Solutions', email: 'hello@globalsol.com', phone: '555-0004', company: 'Global', status: 'proposal', value: 120000, createdAt: '2024-01-12', updatedAt: '2024-01-17', ownerId: 'user-2', teamId: 'team-1' },
      { id: '5', name: 'Innovation Labs', email: 'contact@innov.com', phone: '555-0005', company: 'InnoLab', status: 'won', value: 200000, createdAt: '2024-01-01', updatedAt: '2024-01-19', ownerId: 'user-3', teamId: 'team-1' }
    ],
    total: 5
  });
});

app.post('/api/leads', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({
    success: true,
    data: { id: '4', name, email, status: 'new', value: 0 }
  });
});

app.get('/api/leads/:id', (req, res) => {
  res.json({
    success: true,
    data: { id: req.params.id, name: 'Sample Lead', email: 'lead@example.com', status: 'new', value: 50000 }
  });
});

app.patch('/api/leads/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Lead updated',
    data: { id: req.params.id, ...req.body }
  });
});

app.delete('/api/leads/:id', (_req, res) => {
  res.json({ success: true, message: 'Lead deleted' });
});

// Contacts endpoints
app.get('/api/contacts', (_req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: 'John Smith', email: 'john@example.com', phone: '+1-555-0100', company: 'Acme Corp', title: 'CEO', createdAt: '2024-01-10', updatedAt: '2024-01-18', ownerId: 'user-1', teamId: 'team-1' },
      { id: '2', name: 'Jane Doe', email: 'jane@example.com', phone: '+1-555-0101', company: 'Tech Startup', title: 'CTO', createdAt: '2024-01-12', updatedAt: '2024-01-19', ownerId: 'user-1', teamId: 'team-1' },
      { id: '3', name: 'Bob Wilson', email: 'bob@example.com', phone: '+1-555-0102', company: 'Enterprise Ltd', title: 'CFO', createdAt: '2024-01-08', updatedAt: '2024-01-17', ownerId: 'user-2', teamId: 'team-1' },
      { id: '4', name: 'Alice Johnson', email: 'alice@example.com', phone: '+1-555-0103', company: 'Global Solutions', title: 'VP Sales', createdAt: '2024-01-14', updatedAt: '2024-01-19', ownerId: 'user-3', teamId: 'team-1' }
    ],
    total: 4
  });
});

// Error handling
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`✅ Mock API Server running on http://localhost:${PORT}`);
  console.log(`🔗 Health check: curl http://localhost:${PORT}/health`);
  console.log(`📊 Sample endpoints:`);
  console.log(`   GET  /api/leads`);
  console.log(`   POST /api/leads`);
  console.log(`   GET  /api/contacts`);
});
