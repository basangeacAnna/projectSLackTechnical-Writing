# projectSLackTechnical-Writing
# ChatFlow MVP - Real-Time Team Communication Platform

**Version:** 2.0 (Lab-Optimized)  
**Date:** November 19, 2025  
**Status:** Final for Development & Deployment  
**Environment:** Lab (slackteam.lab.home.lucasacchi.net)

---

## 📋 Overview

ChatFlow MVP is a modern, real-time team communication platform designed to replace fragmented communication tools (email, WhatsApp, Slack) with a cost-effective, self-hosted alternative. Built with Node.js 24.11.1, React 19, and PostgreSQL 15, ChatFlow enables seamless async-first collaboration for distributed teams.

### Key Capabilities

✅ **Real-time messaging** with <500ms latency (p99)  
✅ **Channel-based organization** (public, private, archived)  
✅ **Direct messaging** (1-on-1 and group DM)  
✅ **Full-text search** with advanced filters (from:, in:, date:)  
✅ **File sharing** (up to 10MB per file)  
✅ **User presence & status** (online, away, offline, DND)  
✅ **Markdown formatting** + @mentions + emoji reactions  
✅ **Email verification** & JWT-based authentication  
✅ **Workspace & channel management** with role-based access control (RBAC)  
✅ **Production-ready monitoring** & audit logging

---

## 🎯 Target Users & Success Metrics

### Success Criteria

| Goal | Target | Measurement |
|------|--------|-------------|
| **User Adoption** | 50+ active team members | Daily Active Users (DAU) |
| **Performance** | <500ms message latency (p99) | APM monitoring |
| **Uptime** | 99.5% (43 min/month) | Status page + alerts |
| **Quality** | >80% test coverage | Automated tests |
| **Satisfaction** | NPS >40 | Post-launch survey |
| **Cost** | $3-5/user/month | 60% cheaper than Slack |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **State Management:** Zustand (lightweight, performant)
- **Real-time:** Socket.IO client
- **Styling:** Tailwind CSS
- **Build Tool:** Vite (10-100x faster than webpack)
- **Testing:** Jest + React Testing Library

### Backend
- **Runtime:** Node.js 24.11.1 LTS (Production Ready)
- **Framework:** Express.js + Socket.IO
- **Language:** TypeScript
- **API:** REST + WebSocket
- **Validation:** Joi (schema validation)
- **Logging:** Pino (structured, performant)
- **Security:** Helmet, bcryptjs (cost 12), JWT

### Database & Cache
- **Primary:** PostgreSQL 15+ (ACID, JSON support, powerful indexing)
- **Cache:** Redis 7+ (sub-millisecond latency, pub/sub, session store)
- **File Storage:** Local /tmp or AWS S3
- **Full-Text Search:** PostgreSQL FTS (MVP) → Elasticsearch (v1.1)

### Infrastructure
- **Web Server:** Nginx 1.25+ (HTTP/2, SSL termination, reverse proxy)
- **Process Manager:** PM2 (clustering, monitoring)
- **Deployment:** Single VM (monolithic) — scalable to microservices in v1.1
- **OS:** Ubuntu 22.04+ LTS

---

## 📦 Core Modules (Functional Breakdown)

### Module 1: Authentication & Identity Management
- Self-service signup with email verification (24h link validity)
- JWT-based login with rate limiting (5 attempts → 15min lockout)
- Session management (24h access token, 30-day refresh token)
- User profiles (avatar, bio, timezone, status)
- OAuth integration (v1.1 — Google, GitHub)

### Module 2: Workspace Management
- Create workspaces with unique slugs
- Email-based member invitations (bulk up to 50/day)
- Role-based access control: Owner, Admin, Moderator, Member
- Workspace settings & plan management (free → pro → enterprise)
- Audit logging for all administrative actions

### Module 3: Channel Management
- Public/private channels (creator becomes moderator)
- Channel metadata: name, description, member list
- Auto-created default channels: #general, #random, #announcements
- Archive/restore channels (soft-delete preserves history)
- Channel discovery & search

### Module 4: Real-Time Messaging
- Send messages (max 4,000 chars) with Markdown support
- Edit messages within 1-hour window (with edit history)
- Soft-delete messages (preserved for compliance)
- Message threading (replies to specific messages)
- Emoji reactions (20+ emojis in MVP)
- Typing indicators (<100ms broadcast)
- WebSocket broadcast to all channel members (<500ms)

### Module 5: Direct Messaging
- 1-on-1 conversations with persistent history
- Group DM (3+ users) with shared conversation
- Same features as channels: edit, delete, reactions
- Online/offline status indicators
- Typing notifications

### Module 6: Search & Discovery
- Full-text search across all messages
- Advanced filters: `from:@user`, `in:#channel`, `before:DATE`, `after:DATE`
- Results <2 seconds (p95)
- 20 results per page, relevance ranking
- Permission-based filtering (only show channels user is member of)

### Module 7: Notifications & Presence
- In-app toast notifications (5s auto-dismiss)
- Browser push notifications (opt-in)
- @mention detection & alerts
- User presence broadcast (online, away, offline, DND)
- Notification preferences per channel/DM
- Unread message badges

### Module 8: File Management
- File upload/download (max 10MB per file)
- File metadata storage (name, size, uploader, timestamp)
- Image inline preview (JPG, PNG, GIF)
- Document icons (PDF, DOC, XLS)
- Virus scanning (optional, async)
- Delete functionality (uploader or moderator)

---

## 🗄️ Database Schema Highlights

### Core Tables

```sql
users (id, email, password_hash, display_name, avatar_url, timezone, status, email_verified, created_at)
workspaces (id, name, slug, owner_id, plan, member_limit, member_count)
user_workspace_members (workspace_id, user_id, role, status)
channels (id, workspace_id, name, slug, type, description, created_by, archived, deleted)
channel_members (channel_id, user_id, role, joined_at)
messages (id, channel_id, user_id, content, thread_id, edited_at, deleted_at, created_at)
message_edit_history (id, message_id, previous_content, new_content, edited_by, edited_at)
reactions (id, message_id, user_id, emoji, created_at)
direct_messages (id, sender_id, recipient_id, content, edited_at, deleted_at, created_at)
files (id, message_id, dm_id, filename, file_size, file_type, storage_path, uploaded_by)
notifications (id, user_id, type, channel_id, message_id, actor_id, read, read_at)
audit_logs (id, workspace_id, actor_id, action, resource_type, resource_id, details, created_at)
```

### Performance Indexes
- `idx_messages_channel_created` on (channel_id, created_at DESC)
- `idx_messages_content_fts` for full-text search
- `idx_user_workspaces` on (user_id, workspace_id)
- `idx_direct_messages_pair` on (sender_id, recipient_id)
- `idx_audit_logs_workspace_created` on (workspace_id, created_at DESC)

---

## 🚀 Lab Deployment

### Prerequisites

```bash
# System requirements
Node.js: 24.11.1 (LTS) — REQUIRED
Python: 3.11.2
PostgreSQL: 15+
Redis: 7+ (optional)
Nginx: 1.25+
OS: Ubuntu 22.04+ LTS
```

### Lab Environment

| Parameter | Value |
|-----------|-------|
| **Hostname** | slackteam.lab.home.lucasacchi.net |
| **Frontend Port** | 8282 (Nginx) |
| **Backend Port** | 4000 (Node.js) |
| **SSH User** | slackteam |
| **SSH Password** | slackteam123 |

### Deployment Steps

#### Step 1: VM Setup
```bash
ssh slackteam@slackteam.lab.home.lucasacchi.net
# Password: slackteam123

# Verify versions
node -v      # v24.11.1
python3 --version  # 3.11.2

# Install system dependencies
sudo apt update
sudo apt install -y postgresql postgresql-contrib redis-server nginx git
sudo systemctl start postgresql redis-server nginx
sudo systemctl enable postgresql redis-server nginx
```

#### Step 2: Database Setup
```bash
sudo -u postgres psql <<EOF
CREATE DATABASE chatflow_dev;
CREATE USER chatflow WITH PASSWORD 'dev_password_secure';
ALTER ROLE chatflow SET client_encoding TO 'utf8';
ALTER ROLE chatflow SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE chatflow_dev TO chatflow;
EOF

# Test connection
psql -U chatflow -d chatflow_dev -h localhost
```

#### Step 3: Backend Deployment
```bash
# Clone repository
git clone https://github.com/your-repo/chatflow.git ~/chatflow
cd ~/chatflow

# Install dependencies
npm install

# Create .env file
cat > .env <<EOF
NODE_ENV=development
NODE_VERSION=24.11.1
PORT=4000
DB_HOST=localhost
DB_USER=chatflow
DB_PASSWORD=dev_password_secure
DB_NAME=chatflow_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-this
EOF

# Run migrations
npm run migrate:up

# Start backend
npm start  # Runs on port 4000

# OR use PM2 for process management:
npm install -g pm2
pm2 start npm --name chatflow -- start
```

#### Step 4: Frontend Deployment
```bash
cd ~/chatflow/frontend
npm install
npm run build  # Outputs to dist/

# Copy to Nginx
sudo mkdir -p /var/www/html/chatflow
sudo cp -r dist/* /var/www/html/chatflow/
```

#### Step 5: Nginx Configuration
```nginx
server {
    listen 8282;
    server_name slackteam.lab.home.lucasacchi.net;
    
    # Frontend static files
    location / {
        root /var/www/html/chatflow;
        index index.html;
        try_files $uri $uri/ /index.html;  # SPA routing
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:4000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_buffering off;
    }
}
```

#### Step 6: Verify Deployment
```bash
# Test frontend
curl http://slackteam.lab.home.lucasacchi.net:8282

# Test backend
curl http://slackteam.lab.home.lucasacchi.net:8282/api/health

# Monitor logs
tail -f /var/log/nginx/access.log
tail -f ~/.pm2/logs/chatflow-out.log
pm2 logs chatflow
```

---

## 🔌 API Specification

### REST Endpoints

#### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

#### Users
```
GET    /api/users/:id
PUT    /api/users/me
GET    /api/users  # List workspace members
```

#### Workspaces
```
POST   /api/workspaces
GET    /api/workspaces
GET    /api/workspaces/:id
PUT    /api/workspaces/:id
POST   /api/workspaces/:id/invite
GET    /api/workspaces/:id/members
```

#### Channels
```
POST   /api/channels
GET    /api/channels
GET    /api/channels/:id
PUT    /api/channels/:id
DELETE /api/channels/:id
POST   /api/channels/:id/members
DELETE /api/channels/:id/members/:userId
```

#### Messages
```
POST   /api/channels/:id/messages
GET    /api/channels/:id/messages
PUT    /api/messages/:id
DELETE /api/messages/:id
POST   /api/messages/:id/reactions
```

#### Search & Discovery
```
GET    /api/search?q=keyword  # Full-text search with filters
```

#### Direct Messages
```
POST   /api/dms
GET    /api/dms
GET    /api/dms/:id/messages
POST   /api/dms/:id/messages
```

### WebSocket Events

| Event | Direction | Payload | Latency |
|-------|-----------|---------|---------|
| `message:send` | Client → Server | {content, channel_id} | — |
| `message:received` | Server → Clients | {message, channel_id} | <500ms |
| `typing:start` | Client → Server | {user_id, channel_id} | <100ms |
| `typing:stop` | Client → Server | {user_id, channel_id} | <100ms |
| `presence:update` | Client → Server | {user_id, status} | <100ms |
| `presence:broadcast` | Server → Clients | {user_id, status} | <500ms |
| `reaction:add` | Client → Server | {message_id, emoji} | <200ms |
| `message:edited` | Server → Clients | {message_id, new_content} | <300ms |
| `message:deleted` | Server → Clients | {message_id} | <300ms |

---

## 📊 Performance Targets (Lab VM)

### Latency Requirements

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Message send | P99: <500ms | WebSocket + DB write |
| Message delivery | P95: <300ms | Real-time broadcast |
| Search query | P95: <2 seconds | Full-text search |
| API response | P95: <150ms | GET /messages |
| Database query | P95: <50ms | Connection pooling |
| File upload | <5s | 10MB file |

### Scalability

| Metric | Target |
|--------|--------|
| Concurrent users | 50-200 |
| Daily active users | 100+ |
| Message throughput | 10K-100K msg/day |
| Database size | <10GB |
| Message send rate | 100+ msg/sec |

### Infrastructure

| Component | Specification |
|-----------|----------------|
| Node.js processes | PM2 cluster mode (4 workers) |
| PostgreSQL connection pool | 20 connections |
| Redis memory | 2GB (cache + session store) |
| Application memory | 512MB per Node process |
| Nginx worker processes | Auto (nproc) |

---

## 🧪 Testing Strategy

### Unit Tests (Jest)
- Auth service: signup, login, token refresh, rate limiting
- Message service: send, edit, delete, search indexing
- Channel service: create, archive, member management
- Utility functions: retry logic, circuit breaker

### Integration Tests (Supertest)
- Message sending end-to-end (persistence + WebSocket broadcast)
- Channel creation with default channels
- User invitation workflow
- File upload/download

### Load Tests (K6)
```javascript
// 50 concurrent users
// Stages: 30s ramp-up, 60s steady, 30s ramp-down
// Thresholds:
//   - p95 latency: <500ms
//   - p99 latency: <1s
//   - error rate: <10%
```

### Performance Benchmarks
- Form validation: <100ms (client-side)
- Database insert: <200ms
- Email send: <5s (async)
- Search indexing: <5s lag (async)

---

## 🔐 Security Architecture

### Authentication
- **Password Hashing:** bcryptjs (cost factor 12 = ~250ms constant-time comparison)
- **Token-Based:** JWT (access: 24h, refresh: 30d)
- **Rate Limiting:** 5 failed login attempts → 15min lockout
- **Email Verification:** 24-hour validity

### Authorization
- **RBAC Matrix:**
  - Owner: unlimited power
  - Admin: create channels, manage users
  - Moderator: manage own channels, delete messages
  - Member: send messages, basic reactions

### Data Protection
- **Encryption:** SSL/TLS termination at Nginx
- **XSS Prevention:** HTML entity escaping, Content Security Policy
- **SQL Injection:** Parameterized queries, prepared statements
- **CSRF:** CORS configuration, same-site cookie policy
- **Audit Logging:** All sensitive actions (user_signup, user_deleted, message_edited)

### Error Handling
- **Retry Logic:** Exponential backoff (1s, 2s, 4s)
- **Circuit Breaker:** Fail-fast for external service failures
- **Graceful Degradation:** Cached data fallback

---

## 📋 MVP Scope (Tier 1: MUST HAVE)

- ✅ User authentication (signup, login, email verification)
- ✅ Workspace creation & member management
- ✅ Public/private channels
- ✅ Real-time messaging with WebSocket
- ✅ Message editing (1-hour window) & deletion (soft-delete)
- ✅ Emoji reactions
- ✅ @mentions & notifications
- ✅ Full-text search with filters
- ✅ Direct messaging (1-on-1 & group)
- ✅ File sharing (max 10MB)
- ✅ User presence (online/away/offline)
- ✅ Typing indicators
- ✅ Message threading
- ✅ Audit logging

## 🚧 Future Work (v1.1+)

- ❌ Voice/video calling
- ❌ Screen sharing
- ❌ Custom bots & workflows
- ❌ End-to-end encryption (E2EE)
- ❌ Native mobile apps (iOS/Android)
- ❌ Advanced AI features (search suggestions, auto-summarize)
- ❌ Enterprise SSO (SAML/OAuth2 provider)
- ❌ Elasticsearch integration (advanced search)
- ❌ Message history 90+ days retention
- ❌ Microservices architecture (split services)

---

## 📋 Known Limitations

| Limitation | Workaround | Target v1.1 |
|------------|-----------|------------|
| 48-hour message history (MVP) | Manual export/backup | 90-day retention |
| Single VM deployment | Monolithic easier to debug | Microservices split |
| PostgreSQL FTS only | Sufficient for MVP | Elasticsearch integration |
| No mobile apps | Use web + progressive app | Native iOS/Android |
| No E2E encryption | Data privacy via self-hosting | TLS everywhere |

---

## 📈 Implementation Roadmap

### Week 1: Backend Foundation
- Database schema & migrations
- Authentication service (signup, login, rate limiting)
- API gateway (Express + Nginx)
- Health check endpoint

### Week 2: Core Messaging
- Message CRUD & WebSocket server
- Channels & membership management
- Real-time broadcast
- Search indexing

### Week 3: Frontend UI
- Login/signup forms
- Workspace selector
- Channel list & messaging UI
- Search interface

### Week 4: Polish & Deploy
- Load testing (K6, 100 concurrent users)
- Security audit (penetration testing)
- Monitoring setup (Prometheus, Grafana)
- Production deployment

---

## 🔍 Quality Assurance Checklist

- [ ] All REST endpoints return correct HTTP status codes
- [ ] WebSocket messages delivered <500ms (p99)
- [ ] Search results <2 seconds (p95)
- [ ] File upload <5 seconds for 10MB
- [ ] Email sent within 5 seconds
- [ ] No plaintext passwords in logs
- [ ] XSS prevention verified (HTML injection test)
- [ ] SQL injection prevention verified (parameterized queries)
- [ ] Rate limiting enforced (5 attempts → lockout)
- [ ] CORS properly configured
- [ ] JWT token expiry enforced
- [ ] Database backups working
- [ ] Disaster recovery tested
- [ ] Test coverage >80%
- [ ] Load test: 50 concurrent users without errors

---

## 🤝 Contributing

This project follows GitFlow branching strategy:

```bash
# Feature branch
git checkout -b feature/FEAT-XXX

# Commit with conventional commits
git commit -m "feat(messaging): add emoji reactions"

# Create pull request → peer review → merge
```

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Jest for unit tests (>80% coverage)
- Conventional commits for changelog automation

---

## 📝 License & Attribution

**Project:** ChatFlow MVP  
**Version:** 2.0 (Lab-Optimized)  
**Last Updated:** November 19, 2025  
**Author:** Senior Software Architect  
**Team:** Slack Team (slackteam.lab.home.lucasacchi.net)

---

## 📞 Support & Contact

For issues, questions, or contributions:

1. Check existing GitHub issues/documentation
2. Create a detailed issue with reproduction steps
3. Contact: slackteam@lab.home.lucasacchi.net
4. Emergency: SSH into lab VM (credentials above)

---

**Status:** Final for Development & Lab Deployment  
**Next Review:** Upon MVP Milestone 1 completion (Week 1 end)

**Memo:** crete the .env file using env-example.md as template