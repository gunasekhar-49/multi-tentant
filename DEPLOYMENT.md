# Deployment & DevOps Guide

## Local Development

### Prerequisites

```bash
# Check versions
node --version      # v18.0.0 or higher
npm --version       # v9.0.0 or higher
docker --version    # Docker 20+
```

### Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create .env file
cp .env.example .env

# 3. Configure database
# Edit .env with your PostgreSQL credentials

# 4. Start PostgreSQL (if not using Docker)
# Download PostgreSQL 15 from postgresql.org
# Or use Docker:
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=crm_dev \
  postgres:15-alpine

# 5. Run migrations
npm run migrate

# 6. Seed demo data
npm run seed

# 7. Start development server
npm run dev

# Server runs on http://localhost:5000
# Health check: curl http://localhost:5000/health
```

---

## Docker Deployment

### Single Command Deployment

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop everything
docker-compose down

# Clean up volumes (WARNING: deletes data)
docker-compose down -v
```

### What This Sets Up

```
PostgreSQL 15      → http://localhost:5432
Redis 7           → http://localhost:6379
API Server        → http://localhost:5000
```

### Environment Variables

Create `.env` file in project root:

```
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
REFRESH_TOKEN_SECRET=your-refresh-secret
DATABASE_URL=postgresql://crm_user:crm_password@postgres:5432/crm_dev
REDIS_URL=redis://redis:6379
```

---

## Production Deployment

### AWS Deployment (Recommended)

#### Architecture

```
CloudFront (CDN)
    ↓
ALB (Load Balancer)
    ↓
ECS Fargate (3 instances)
    ↓
RDS PostgreSQL (Multi-AZ)
    ↓
ElastiCache Redis
    ↓
S3 (File storage)
```

#### Setup Steps

##### 1. RDS PostgreSQL

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier crm-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxx \
  --multi-az
```

##### 2. ElastiCache Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id crm-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

##### 3. ECR (Docker Registry)

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name crm-api

# Build and push image
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

docker build -t crm-api ./backend
docker tag crm-api:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/crm-api:latest
docker push \
  123456789.dkr.ecr.us-east-1.amazonaws.com/crm-api:latest
```

##### 4. ECS Cluster & Service

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name crm-prod

# Create task definition (see Dockerfile)
# Create service with 3 replicas
# Configure ALB with health checks
# Setup auto-scaling (target CPU 70%)
```

##### 5. Environment Variables (Secrets Manager)

```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name crm/prod/env \
  --secret-string '{
    "JWT_SECRET": "xxx",
    "DATABASE_URL": "postgresql://...",
    "REDIS_URL": "redis://..."
  }'
```

##### 6. Database Migration

```bash
# SSH into ECS task
# Or use AWS Systems Manager Session Manager

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### Heroku Deployment (Fastest)

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
heroku create crm-api-prod

# 4. Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0 \
  --app crm-api-prod

# 5. Add Redis
heroku addons:create heroku-redis:premium-0 \
  --app crm-api-prod

# 6. Set environment variables
heroku config:set JWT_SECRET=xxx \
  --app crm-api-prod

# 7. Deploy
git push heroku main

# 8. Run migrations
heroku run npm run migrate --app crm-api-prod

# 9. Check logs
heroku logs --tail --app crm-api-prod
```

### DigitalOcean Deployment

```bash
# 1. Create Droplet (Docker image)
# - 2GB RAM, 2 vCPU
# - Ubuntu 22.04 with Docker pre-installed

# 2. Install Docker Compose
ssh root@your-droplet-ip
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 3. Clone repository
git clone <repo-url> crm
cd crm

# 4. Create .env
cp .env.example .env
# Edit with production values

# 5. Update docker-compose.yml for production
# - Use specific image tags (not latest)
# - Add health checks
# - Set resource limits

# 6. Start services
docker-compose up -d

# 7. Setup backup
# Schedule daily backups to S3
```

---

## Monitoring & Observability

### Health Checks

```bash
# Application health
curl http://localhost:5000/health

# Database connection
psql postgresql://user:pass@localhost:5432/crm_dev \
  -c "SELECT 1"

# Redis connection
redis-cli -u redis://localhost:6379 PING
```

### Logging

All logs go to:
- `logs/error.log` – Errors only
- `logs/combined.log` – Everything
- Console (development)

Production recommendation: Send logs to:
- **CloudWatch** (AWS)
- **Papertrail** (third-party)
- **Datadog** (comprehensive APM)
- **ELK Stack** (self-hosted)

### Metrics to Monitor

```
API Response Time (should be <200ms)
Database Query Time (should be <100ms)
Error Rate (should be <0.1%)
Rate Limit Hits (indicates abuse/DDoS)
Active Users (per tenant)
Database Connections (monitor pool)
Memory Usage (watch for leaks)
CPU Usage (scale when >80%)
```

### Alerting Rules

```yaml
- Alert if response time > 1 second
- Alert if error rate > 1%
- Alert if database connections > 80% of pool
- Alert if disk usage > 80%
- Alert if memory usage > 85%
- Alert if rate limiter exceeded 100+ times/hour
```

---

## Backup & Disaster Recovery

### Database Backup Strategy

```bash
# Automated daily backups (AWS RDS)
aws rds create-db-snapshot \
  --db-instance-identifier crm-postgres \
  --db-snapshot-identifier crm-prod-$(date +%Y-%m-%d)

# Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier crm-postgres-restored \
  --db-snapshot-identifier crm-prod-2024-02-15
```

### Point-in-Time Recovery

```bash
# Restore to specific timestamp (within 35 days)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier crm-postgres \
  --target-db-instance-identifier crm-postgres-restored \
  --restore-time "2024-02-15T10:00:00"
```

### Backup Verification

```bash
# Monthly test restoration to staging
1. Snapshot production database
2. Restore to staging environment
3. Run data integrity checks
4. Verify application functionality
5. Document results
```

---

## Security Checklist

- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured (only allow necessary ports)
- [ ] Database credentials in Secrets Manager
- [ ] API keys rotated quarterly
- [ ] WAF (Web Application Firewall) enabled
- [ ] DDoS protection enabled (AWS Shield, Cloudflare)
- [ ] Backup encryption enabled
- [ ] Database encryption enabled
- [ ] VPC configured with private subnets
- [ ] Security groups follow least-privilege principle
- [ ] CloudTrail enabled for audit logging
- [ ] Secrets not in environment files (use Secrets Manager)
- [ ] Regular security patches applied
- [ ] Penetration testing completed

---

## Performance Optimization

### Database Optimization

```sql
-- Check slow queries
SELECT query, calls, mean_time FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### API Optimization

```typescript
// Use pagination
GET /api/leads?limit=20&offset=0

// Select only needed fields
SELECT firstName, lastName, email FROM leads
NOT SELECT *

// Batch operations
POST /api/leads/import/bulk
NOT POST /api/leads 1000 times
```

### Caching Strategy

```
Static assets → CloudFront (CDN)
Database queries → Redis (cache layer)
User sessions → Redis (no database hits)
Tenant config → Memory cache (reload on change)
```

---

## Scaling Roadmap

### Month 1: MVP (1 server, 1 database)

```
$100-200/month infrastructure
```

### Month 3: Multiple Servers (10+ tenants)

```
Load balancer → 3 servers
$300-500/month infrastructure
```

### Month 6: Database Replicas (100+ tenants)

```
Primary-replica PostgreSQL setup
Read replicas for reports
$500-1000/month infrastructure
```

### Month 12: Microservices (1000+ tenants)

```
Separate services for:
- Auth
- CRM
- Notifications
- Reporting
$2000-5000/month infrastructure
```

---

## Deployment Checklist

Before going live:

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Backup strategy in place
- [ ] Monitoring and alerting setup
- [ ] SSL certificates installed
- [ ] Rate limiting tuned
- [ ] CORS configured for your domain
- [ ] Security headers verified
- [ ] Logging pipeline working
- [ ] Health checks responding
- [ ] Load testing completed (1000+ RPS)
- [ ] Failover tested
- [ ] Disaster recovery plan written
- [ ] On-call rotation established
- [ ] Incident response procedures documented

---

**You are now operating an enterprise-grade infrastructure.**
