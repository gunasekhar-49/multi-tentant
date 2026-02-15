# Multi-Tenant SaaS CRM – Production-Grade Architecture

## 🎯 System Overview

This is an **enterprise-ready** multi-tenant SaaS CRM built with strict data isolation, advanced security, and scalable design patterns.

### Architecture Layers

```
Client (React/Web) 
    ↓
API Gateway (Express + Security Middleware)
    ↓
Services (Business Logic)
    ↓
Database (PostgreSQL - Tenant Isolated)
    ↓
Infrastructure (Docker, Redis, Background Jobs)
```

---

## 🔐 Security Middleware Stack

The system implements **10 layers of security**, not just Helmet:

### 1. **Request ID & Logging**
- Every request gets unique ID
- Full audit trail of all operations
- Request timing and performance metrics

### 2. **Tenant Resolver**
- Extracts tenant context from subdomain, headers, JWT
- Ensures zero cross-tenant data leakage
- Validates tenant context on every request

### 3. **Authentication (JWT)**
- JWT token verification on protected routes
- Token expiry and refresh logic
- Prevents unauthorized access

### 4. **Authorization (RBAC)**
- Role-based access control with fine-grained permissions
- Matrix: `Who → Can Do → What → On Which Resource`
- 6 system roles: Super Admin, Tenant Admin, Manager, Sales User, Support User, Read-Only

### 5. **Rate Limiting**
- Global limits: 100 requests/15min per IP
- Auth limits: 5 login attempts/15min (prevents brute force)
- API limits: 200 requests/15min for authenticated users
- Redis-backed for distributed systems

### 6. **Input Sanitization**
- XSS prevention (removes script tags, HTML)
- NoSQL injection protection
- Removes dangerous operators from user input

### 7. **CORS & Security Headers**
- Helmet: CSP, HSTS, X-Frame-Options, etc.
- Strict referrer policy
- Prevents clickjacking, script injection

### 8. **Audit Logging**
- Every write operation logged with before/after state
- Who, what, when, where tracking
- Enterprise compliance ready

### 9. **Idempotency Protection**
- Payment operations protected against double-charges
- Request fingerprinting
- Prevents race conditions

### 10. **Feature Gating**
- Users can't access features beyond their plan
- Prevents revenue leakage
- Dynamic feature flags

---

## 📊 Database Design

### Multi-Tenant Isolation Pattern

Every table has:

```sql
tenant_id    -- Essential: NO cross-bleed
created_by   -- Immutable: who initiated
updated_by   -- Mutable: who last changed
timestamps   -- Always: audit trail
```

### Core Tables

```
Tenants
├── Users (per tenant)
├── Roles (per tenant)
├── Leads
├── Contacts
├── Accounts
├── Deals
├── Tasks
├── Activities (timeline)
└── Tickets
```

---

## 🛠 Core Engines

### 1. **Identity Engine** (`IdentityService`)
- User registration and password hashing (bcryptjs)
- Login with JWT token generation
- Token refresh and revocation
- Session management

### 2. **Tenant Engine** (`TenantService`)
- Create and manage tenants
- Default role initialization
- Plan management (free, pro, enterprise)
- Tenant suspension/cancellation

### 3. **RBAC Engine** (`rbacMiddleware`)
- Permission matrix by role
- Fine-grained resource/action control
- Middleware enforcement on every route

### 4. **CRM Engine** (`CRMService`)
- Complete CRUD for all entities
- Advanced filtering and search
- Bulk import with validation
- CSV export functionality

### 5. **Activity Engine** (`ActivityService`)
- Call, email, meeting, note logging
- Timeline feeds
- Related entity linking (lead → deal → account)

---

## 📡 API Design

### REST Principles

```
POST   /api/auth/register           -- Create tenant & admin user
POST   /api/auth/login              -- Authenticate
POST   /api/auth/refresh            -- Refresh token
POST   /api/auth/logout             -- Logout

GET    /api/leads                   -- List (with filters)
POST   /api/leads                   -- Create
GET    /api/leads/:id               -- Get single
PATCH  /api/leads/:id               -- Update
DELETE /api/leads/:id               -- Delete
POST   /api/leads/import/bulk       -- Bulk import
GET    /api/leads/export/csv        -- Export
```

### Same Pattern for:
- `/api/contacts`
- `/api/accounts`
- `/api/deals`
- `/api/tasks`
- `/api/tickets`
- `/api/activities`

### Tenancy in Every Request

```typescript
// Header-based
X-Tenant-ID: tenant-uuid

// JWT token (primary)
{
  userId: "...",
  tenantId: "...",  // ← Validated on every request
  email: "...",
  role: "..."
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### Quick Start

```bash
# 1. Clone and install
cd backend
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Run migrations
npm run migrate

# 4. Seed demo data
npm run seed

# 5. Start server
npm run dev
# Server runs on http://localhost:5000
```

### Docker Setup

```bash
# From project root
docker-compose up

# Postgres available at: localhost:5432
# Redis available at: localhost:6379
# API available at: http://localhost:5000
```

---

## 🧪 Testing Flows

### Register New Tenant

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mycompany.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "company": "My Company"
  }'

# Response:
{
  "data": {
    "user": { ... },
    "tenant": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "..."
    }
  }
}
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "password123",
    "tenantId": "tenant-uuid"
  }'
```

### Create Lead (Authenticated)

```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "X-Tenant-ID: tenant-uuid" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@company.com",
    "phone": "+1234567890",
    "company": "Tech Corp",
    "source": "linkedin",
    "status": "new"
  }'
```

---

## 📚 What Makes This Production-Grade

✅ **Strict Schemas** – TypeScript enforces types everywhere  
✅ **Central Error Handling** – Consistent error responses  
✅ **Versioned APIs** – Ready for backwards compatibility  
✅ **Audit Everything** – Every write logged with context  
✅ **Rate Limiting** – Prevents abuse and DDoS  
✅ **Request Tracing** – Debug issues with request IDs  
✅ **Graceful Shutdown** – Proper signal handling  
✅ **Health Checks** – /health endpoint + Docker integration  
✅ **Security First** – 10 middleware layers  
✅ **Scalable Design** – Ready for microservices split  

---

## 🔄 Coming Next

### Phase 2: Background Jobs
- Bull queue for async tasks
- Webhook delivery with retries
- Email notifications
- Report generation

### Phase 3: Realtime
- WebSocket for live updates
- Deal pipeline changes
- Task assignments
- Notification feeds

### Phase 4: Advanced Features
- Custom fields per tenant
- Saved filters with sharing
- AI-powered insights
- Bulk operations with validation

### Phase 5: Frontend
- React + TypeScript
- Tenant context provider
- Workspace switcher
- Command palette
- Rich UI components

---

## 👤 User Hierarchy

### Inside One Tenant

| Role | Scope | Permissions |
|------|-------|-------------|
| **Tenant Admin** | All | Full access + billing, users, roles |
| **Manager** | Team | Leads, contacts, deals, tasks, reports |
| **Sales User** | Personal + Team | Leads, contacts, deals, tasks, activities |
| **Support User** | Tickets | Contacts, tickets, activities |
| **Read Only** | View | Leads, contacts, deals, accounts |

### Across Platform

| Role | Purpose |
|------|---------|
| **Super Admin** | Platform owner – all tenants |
| **Support/Success** | Can impersonate tenants for support |
| **System Services** | Cron jobs, automation, billing |

---

## 📈 Scaling Checklist

- [ ] API behind load balancer
- [ ] Database replication (primary-replica)
- [ ] Redis cluster for rate limiting
- [ ] S3 for file storage (attachments)
- [ ] CDN for static assets
- [ ] Background job workers (separate service)
- [ ] Webhook delivery service
- [ ] Analytics pipeline
- [ ] Monitoring & alerting
- [ ] Database backups & disaster recovery

---

## 🎓 Interview Ready

This system demonstrates:

1. **Multi-tenancy thinking** – Strict isolation, no data leaks
2. **Security mindset** – Layers, not single solution
3. **Scalable design** – Ready to split into microservices
4. **Enterprise patterns** – Audit, RBAC, feature gates
5. **Production readiness** – Error handling, logging, health checks
6. **Clean architecture** – Separation of concerns (middleware/services/routes)
7. **Database design** – Proper indexing, foreign keys, constraints
8. **API design** – RESTful, consistent, versioned

**This is no longer student code. This is a platform.**

---

## 📞 Support

For deployment questions or architecture decisions:
- Check logs: `docker-compose logs api`
- Database connection: `psql postgresql://user:pass@localhost:5432/crm_dev`
- Redis CLI: `redis-cli -p 6379`

---

**Ready to weaponize?** Next phases include webhooks, realtime, custom fields, and the React frontend.
