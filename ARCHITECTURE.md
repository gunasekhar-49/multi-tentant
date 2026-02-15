# Architecture Deep Dive

## Data Isolation Strategy

### The Golden Rule

```typescript
// EVERY database query MUST include tenant_id filter
// ❌ WRONG:
const leads = await Lead.query().where('status', 'new');

// ✅ CORRECT:
const leads = await Lead.query()
  .where('tenantId', req.tenantId)
  .where('status', 'new');
```

### Middleware Chain Enforcement

```
1. tenantResolverMiddleware
   └─ Extracts tenant from subdomain/header/JWT
   └─ Sets req.tenantId

2. authMiddleware
   └─ Verifies JWT token
   └─ Sets req.user
   └─ Validates token.tenantId === req.tenantId

3. rbacMiddleware
   └─ Checks user role permissions
   └─ Verifies resource/action access

4. Every route handler
   └─ Uses req.tenantId in ALL database queries
```

---

## Security Audit Checklist

### What Happens When User Logs In

```typescript
// 1. Rate limiting checked
// 2. Email + password validated
// 3. Password compared against hash (bcryptjs)
// 4. User status checked (active/inactive/invited)
// 5. JWT tokens generated (access + refresh)
// 6. Last login timestamp updated
// 7. Activity logged
```

### What Happens On Every Protected Request

```typescript
// 1. Request ID generated (tracing)
// 2. Rate limit checked (Redis)
// 3. Input sanitized (XSS removal)
// 4. Tenant context extracted
// 5. JWT token verified
// 6. Token expiry validated
// 7. Tenant from token vs request compared
// 8. User role loaded from database
// 9. Permission matrix checked
// 10. Subscription/plan validated
// 11. Request logged with context
// 12. Response sent with request ID header
```

---

## Performance Considerations

### Database Indexing

```sql
-- Leads table has these indexes:
- tenantId (fast filtering per tenant)
- status (fast state queries)
- source (fast grouping)
- createdAt (fast sorting)

-- Combined indexes for common queries:
CREATE INDEX idx_leads_tenant_status ON leads(tenantId, status);
CREATE INDEX idx_leads_tenant_created ON leads(tenantId, createdAt DESC);
```

### Query Optimization

```typescript
// ❌ N+1 queries
const leads = await Lead.query().where('tenantId', tenantId);
for (const lead of leads) {
  const activities = await Activity.query()
    .where('relatedToId', lead.id); // Loop query!
}

// ✅ Eager loading
const leads = await Lead.query()
  .where('tenantId', tenantId)
  .withGraphFetched('activities');
```

---

## Error Handling Philosophy

### User-Facing Errors

```json
{
  "error": "string (machine-readable code)",
  "message": "string (human-readable description)",
  "requestId": "string (for support team)",
  "timestamp": "ISO string"
}
```

### Examples

```json
// 400 Bad Request
{
  "error": "validation_error",
  "message": "Invalid email format",
  "details": [
    { "field": "email", "message": "valid email is required" }
  ]
}

// 401 Unauthorized
{
  "error": "invalid_credentials",
  "message": "Email or password is incorrect"
}

// 403 Forbidden
{
  "error": "insufficient_permissions",
  "message": "You don't have permission to delete leads"
}

// 404 Not Found
{
  "error": "not_found",
  "message": "Lead with ID abc123 not found"
}

// 429 Too Many Requests
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests, please try again in 15 minutes"
}
```

---

## Tenant Isolation Test Cases

### Test 1: Cross-Tenant Lead Access

```typescript
// User A (tenant-1) tries to access lead from tenant-2
GET /api/leads/lead-from-tenant-2
Authorization: Bearer token-from-tenant-1

// Expected: 404 or 403 (lead doesn't exist in tenant-1's context)
```

### Test 2: Token Tenant Mismatch

```typescript
// Token says tenant-1, but request header says tenant-2
GET /api/leads
Authorization: Bearer jwt-with-tenant-1
X-Tenant-ID: tenant-2

// Expected: 403 Forbidden (tenant mismatch)
```

### Test 3: Subdomain Isolation

```
// Request from subdomain
api.acme.example.com/api/leads
// tenant extracted as "acme"

// Request from api.mycompany.example.com
// tenant extracted as "mycompany"

// Zero cross-bleed: different databases/rows
```

---

## Scaling from 1 Tenant to 1000s

### Month 1: Single Tenant (You)

```
Node Server → PostgreSQL
             └─ 1 tenant's data
```

### Month 3: 10 Tenants

```
Node Server → PostgreSQL
             ├─ Tenant A data
             ├─ Tenant B data
             └─ Tenant C data

// All queries filtered by tenantId
// No code changes needed
```

### Month 6: 1000+ Tenants

```
Load Balancer
    ├─ API Server 1
    ├─ API Server 2
    └─ API Server 3
        ↓
    PostgreSQL (Primary)
        ↓
    PostgreSQL Replica
        ↓
    Redis Cluster (sessions/cache)

// Still using same code
// Database handles volume
```

### Month 12: Hybrid Approach

```
API Gateway
    ├─ Tenant Service (handles tenant creation/plans)
    ├─ CRM Service (leads/contacts/deals)
    ├─ Notification Service (emails/webhooks)
    └─ Reporting Service (analytics)

// Each service has its own database if needed
// Cross-service communication via events
```

---

## Security Incident Response

### Scenario: Unauthorized Lead Access

```typescript
// Check request log
GET /api/leads?tenantId=hacked-tenant-id
Authorization: Bearer valid-token-from-user-1

// Middleware catches this:
// 1. Token verified (user-1, tenant-1)
// 2. Query param has tenant-id (hacked-tenant)
// 3. tenantResolverMiddleware sets req.tenantId = hacked-tenant
// 4. authMiddleware compares token.tenantId vs req.tenantId
// 5. MISMATCH → 403 Forbidden
// 6. Security alert logged with request ID
// 7. Incident response team notified
```

---

## Compliance Readiness

### GDPR Requirements

- ✅ Audit trail of all data access
- ✅ Data export per tenant
- ✅ Right to be forgotten (delete cascade)
- ✅ Data portability (CSV export)

### SOC 2 Requirements

- ✅ Encrypted in transit (HTTPS)
- ✅ Hashed passwords (bcryptjs)
- ✅ Rate limiting (prevents enumeration)
- ✅ Audit logging (all mutations)
- ✅ Access controls (RBAC)

### PCI Compliance

- ⚠️ Stripe integration (don't store cards)
- ✅ Webhook verification
- ✅ No payment data in logs

---

## Cost Analysis

### Infrastructure (AWS Example)

```
RDS PostgreSQL: $30-100/month
  ├─ Multi-AZ failover
  ├─ Automated backups
  └─ Read replicas for scale

ElastiCache Redis: $15-50/month
  ├─ Session/cache
  └─ Rate limiting

ECS/EKS API Servers: $50-200/month
  ├─ 3+ instances for HA
  └─ Auto-scaling by CPU

Total: ~$100-350/month for serious deployment
```

### Per-Tenant Revenue Model

```
Free: $0
  ├─ Up to 1 user
  ├─ 100 leads/contacts
  └─ Community support

Pro: $99/month
  ├─ Up to 10 users
  ├─ Unlimited records
  └─ Email support

Enterprise: $999/month
  ├─ Unlimited users
  ├─ Custom fields
  ├─ API access
  └─ Phone support
```

### Unit Economics at Scale

```
1000 Pro tenants × $99/month = $99,000/month
Cost of infrastructure: ~$10,000/month
Gross margin: 90%

This is a multi-million dollar business.
```

---

## Common Vulnerabilities & Defenses

| Vulnerability | Attack | Defense |
|---|---|---|
| SQL Injection | Modify query to access other data | Parameterized queries (Objection ORM) |
| XSS | <script>alert('hacked')</script> | Input sanitization middleware |
| CSRF | Trick user into changing settings | SameSite cookies + CSRF tokens |
| Brute Force | Try 10,000 passwords | Rate limiting (5 attempts/15min) |
| Token Hijacking | Steal JWT and impersonate user | Short expiry + refresh token rotation |
| Cross-Tenant | Access tenant-B from tenant-A | Middleware enforcement on req.tenantId |
| Privilege Escalation | User gives themselves admin | RBAC checks on every mutation |
| Mass Assignment | POST /users {"role": "admin"} | Whitelist only allowed fields |
| Insecure Direct Object References | GET /users/2 (isn't your user) | tenantId filter + ownership check |
| Sensitive Data Exposure | Password in logs | Never log sensitive fields |

---

## Production Deployment Checklist

- [ ] Environment variables configured (no secrets in code)
- [ ] Database migrations applied
- [ ] Demo data seeded
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured for your scale
- [ ] Logging configured with retention policy
- [ ] Backups scheduled (daily minimum)
- [ ] Health checks enabled
- [ ] Monitoring/alerting setup
- [ ] Incident response runbook written
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] GDPR/compliance review done

---

**This architecture is designed for the next 10 years and 1000 customers.**
