# API Documentation

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
```

## Endpoints

### Authentication

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "company": "My Company"
}

Response 201:
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@company.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tenant": {
      "id": "uuid",
      "name": "My Company",
      "slug": "admin",
      "plan": "free"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "SecurePass123",
  "tenantId": "tenant-uuid"
}

Response 200:
{
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}

Response 200:
{
  "data": {
    "accessToken": "..."
  }
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Leads

#### List Leads

```http
GET /api/leads?status=new&assignedTo=user-id&limit=20&offset=0
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>

Response 200:
{
  "data": {
    "leads": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "company": "Tech Corp",
        "status": "qualified",
        "source": "linkedin",
        "score": 85,
        "createdAt": "2024-02-15T10:00:00Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 150
    }
  }
}
```

#### Create Lead

```http
POST /api/leads
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Tech Corp",
  "industry": "Technology",
  "source": "linkedin",
  "status": "new",
  "score": 50
}

Response 201:
{
  "data": {
    "lead": { ... }
  }
}
```

#### Get Lead

```http
GET /api/leads/:id
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>

Response 200:
{
  "data": {
    "lead": { ... },
    "activities": [
      {
        "id": "uuid",
        "type": "call",
        "subject": "Initial Discovery",
        "createdAt": "2024-02-15T10:00:00Z"
      }
    ]
  }
}
```

#### Update Lead

```http
PATCH /api/leads/:id
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
Content-Type: application/json

{
  "status": "qualified",
  "score": 85,
  "notes": "High potential customer"
}

Response 200:
{
  "data": {
    "lead": { ... }
  }
}
```

#### Delete Lead

```http
DELETE /api/leads/:id
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>

Response 200:
{
  "data": {
    "message": "Lead deleted"
  }
}
```

#### Bulk Import

```http
POST /api/leads/import/bulk
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
Content-Type: application/json

{
  "leads": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "source": "linkedin"
    }
  ]
}

Response 200:
{
  "data": {
    "result": {
      "successful": 10,
      "failed": 2,
      "errors": [...]
    }
  }
}
```

#### Export

```http
GET /api/leads/export/csv
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>

Response 200:
CSV file download
```

### Contacts

Same pattern as Leads:
- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/contacts/:id`
- `PATCH /api/contacts/:id`
- `DELETE /api/contacts/:id`

### Accounts

- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/accounts/:id`
- `PATCH /api/accounts/:id`
- `DELETE /api/accounts/:id`

### Deals

- `GET /api/deals`
- `POST /api/deals`
- `GET /api/deals/:id`
- `PATCH /api/deals/:id`
- `DELETE /api/deals/:id`

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "validation_error",
  "message": "Invalid email format",
  "details": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ],
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-02-15T10:00:00Z"
}
```

### 401 Unauthorized

```json
{
  "error": "invalid_credentials",
  "message": "Email or password is incorrect",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-02-15T10:00:00Z"
}
```

### 403 Forbidden

```json
{
  "error": "insufficient_permissions",
  "message": "You don't have permission to delete leads",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-02-15T10:00:00Z"
}
```

### 429 Too Many Requests

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests from this IP, please try again later.",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-02-15T10:00:00Z"
}
```

---

## Rate Limiting

- Global: 100 requests per 15 minutes per IP
- Auth: 5 login attempts per 15 minutes per email
- API: 200 requests per 15 minutes per authenticated user

Response headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1613401200
```
