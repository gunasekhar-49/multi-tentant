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
      { id: '1', name: 'Acme Corp', email: 'contact@acme.com', status: 'new', value: 50000 },
      { id: '2', name: 'Tech Startup', email: 'info@techstartup.com', status: 'qualified', value: 75000 },
      { id: '3', name: 'Enterprise Ltd', email: 'sales@enterprise.com', status: 'negotiating', value: 150000 }
    ],
    total: 3
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
      { id: '1', name: 'John Smith', email: 'john@example.com', phone: '+1-555-0100', title: 'CEO' },
      { id: '2', name: 'Jane Doe', email: 'jane@example.com', phone: '+1-555-0101', title: 'CTO' }
    ],
    total: 2
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
