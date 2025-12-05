# 🗄️ ChatFlow MVP - Database Setup Prompt for Antigravity Agents

**Project:** ChatFlow MVP (Slack-like application)  
**Database:** PostgreSQL 15  
**VM Host:** 192.168.1.100  
**Target Date:** Complete by End of Day  
**Assigned to:** Agent Backend + Agent Supervisor

---

## 📋 OBJECTIVE

Create and configure a PostgreSQL 15 database on the VM with complete schema, indexes, and migrations ready for Node.js backend integration. Database will support real-time messaging, user authentication, workspace management, and search functionality.

---

## 🎯 REQUIREMENTS

### **Phase 1: PostgreSQL Installation & Setup (30 min)**

**Task 1.1: Install PostgreSQL 15**
```bash
# SSH into VM as agent-backend or agent-supervisor
ssh agent-backend@192.168.1.100

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib postgresql-15-pg-trgm

# Verify installation
psql --version  # Should show: psql (PostgreSQL) 15.x

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql  # Should show "active (running)"
```

**Task 1.2: Configure PostgreSQL Access**

```bash
# Switch to postgres user
sudo -i -u postgres

# Start PostgreSQL interactive terminal
psql

# Inside psql, run:
ALTER USER postgres WITH PASSWORD 'postgres_secure_password_123';
\q  # Exit psql

# Edit PostgreSQL configuration to allow local TCP connections
sudo nano /etc/postgresql/15/main/postgresql.conf

# Find and uncomment/modify this line:
# listen_addresses = 'localhost'
# Change to:
listen_addresses = '*'

# Save (Ctrl+O, Enter, Ctrl+X)

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add this line at the end (allows local connections):
# local   all             all                                     trust
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5
# host    all             all             0.0.0.0/0               md5

# Save and exit

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql

# Verify it's listening
sudo netstat -tulpn | grep postgres
# Should show: tcp 0 0 0.0.0.0:5432 ... LISTEN
```

**Deliverable:** ✅ PostgreSQL 15 running on port 5432, accessible locally and from network.

---

### **Phase 2: Create ChatFlow Database & User (15 min)**

**Task 2.1: Create Database and User**

```bash
# Connect as postgres user
sudo -u postgres psql

# Inside psql terminal, execute:

-- Create chatflow database
CREATE DATABASE chatflow_mvp
    ENCODING 'UTF8'
    LC_COLLATE 'en_US.UTF-8'
    LC_CTYPE 'en_US.UTF-8'
    TEMPLATE template0;

-- Create application user with secure password
CREATE USER chatflow_app WITH PASSWORD 'chatflow_app_secure_pwd_456';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE chatflow_mvp TO chatflow_app;

-- Connect to chatflow database
\c chatflow_mvp

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO chatflow_app;

-- Grant table/sequence/function privileges by default
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO chatflow_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO chatflow_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO chatflow_app;

-- Verify
\du   # List users
\l    # List databases

-- Exit
\q
```

**Deliverable:** ✅ Database `chatflow_mvp` created with user `chatflow_app` having full privileges.

---

### **Phase 3: Create Database Schema (45 min)**

**Task 3.1: Create All Tables with Indexes**

Create a file: `/home/agenti/my-mvp-slack/database/schema.sql`

Then execute:

```bash
# Connect to chatflow database as chatflow_app user
psql -h localhost -U chatflow_app -d chatflow_mvp

# Or, paste the complete schema below into psql
```

**Complete Schema (paste into psql or save as schema.sql and execute):**

```sql
-- ============================================================
-- CHATFLOW MVP - PostgreSQL Schema
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'offline', -- online, offline, away, dnd
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_username ON users(LOWER(username));
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 2. WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspaces_created_at ON workspaces(created_at DESC);

-- 3. WORKSPACE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- owner, admin, moderator, member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_role ON workspace_members(role);

-- 4. CHANNELS TABLE
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, LOWER(name))
);

CREATE INDEX idx_channels_workspace_id ON channels(workspace_id);
CREATE INDEX idx_channels_creator_id ON channels(creator_id);
CREATE INDEX idx_channels_is_private ON channels(is_private);
CREATE INDEX idx_channels_created_at ON channels(created_at DESC);

-- 5. CHANNEL MEMBERS TABLE
CREATE TABLE IF NOT EXISTS channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX idx_channel_members_user_id ON channel_members(user_id);

-- 6. MESSAGES TABLE (Core)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    thread_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    edited_at TIMESTAMP,
    edited_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    CHECK (char_length(content) > 0 AND char_length(content) <= 4000)
);

CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC);

-- Full-text search index for messages
CREATE INDEX idx_messages_content_fts ON messages USING GIN(to_tsvector('english', content));

-- Trigram index for fuzzy search
CREATE INDEX idx_messages_content_trigram ON messages USING GIN(content gin_trgm_ops);

-- 7. REACTIONS TABLE
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(20) NOT NULL, -- e.g., "👍", "❤️"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message_id ON reactions(message_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- mention, reply, direct_message, etc.
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    related_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 9. DIRECT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL, -- Unique between two users
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (sender_id != recipient_id)
);

CREATE INDEX idx_direct_messages_conversation_id ON direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- 10. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- user_created, message_sent, channel_created, etc.
    resource_type VARCHAR(50) NOT NULL, -- user, message, channel, workspace
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 11. FILES TABLE
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_message_id ON files(message_id);
CREATE INDEX idx_files_user_id ON files(user_id);

-- ============================================================
-- MATERIALIZED VIEWS (for performance)
-- ============================================================

-- Channel activity summary (cache for dashboard)
CREATE MATERIALIZED VIEW IF NOT EXISTS channel_stats AS
SELECT
    c.id as channel_id,
    c.name,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT m.user_id) as active_users,
    MAX(m.created_at) as last_message_at
FROM channels c
LEFT JOIN messages m ON c.id = m.channel_id AND m.deleted_at IS NULL
WHERE c.is_archived = FALSE
GROUP BY c.id, c.name;

CREATE INDEX idx_channel_stats_channel_id ON channel_stats(channel_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update updated_at timestamp on users
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_timestamp();

-- Similar trigger for workspaces
CREATE OR REPLACE FUNCTION update_workspace_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workspaces_timestamp
BEFORE UPDATE ON workspaces
FOR EACH ROW
EXECUTE FUNCTION update_workspace_timestamp();

-- Similar trigger for channels
CREATE OR REPLACE FUNCTION update_channel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_channels_timestamp
BEFORE UPDATE ON channels
FOR EACH ROW
EXECUTE FUNCTION update_channel_timestamp();

-- ============================================================
-- INITIAL PERMISSIONS (for chatflow_app user)
-- ============================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatflow_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chatflow_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO chatflow_app;

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================
```

**Execute the schema:**

```bash
# Option 1: Copy-paste into psql
psql -h localhost -U chatflow_app -d chatflow_mvp
# Paste entire schema above
# \q to exit

# Option 2: Save to file and execute
psql -h localhost -U chatflow_app -d chatflow_mvp < schema.sql

# Verify tables created
psql -h localhost -U chatflow_app -d chatflow_mvp -c "\dt"
# Should list all 11 tables
```

**Deliverable:** ✅ Complete database schema with 11 tables, 30+ indexes, functions, and triggers.

---

### **Phase 4: Test Connectivity & Insert Test Data (15 min)**

**Task 4.1: Verify Database Connection**

```bash
# From VM terminal (or agent-backend SSH session):
psql -h localhost -U chatflow_app -d chatflow_mvp -c "SELECT version();"

# Should return PostgreSQL version info

# List all tables:
psql -h localhost -U chatflow_app -d chatflow_mvp -c "\dt"

# Expected output:
#  public | audit_logs           | table | chatflow_app
#  public | channel_members      | table | chatflow_app
#  public | channels             | table | chatflow_app
#  ...
```

**Task 4.2: Insert Test Data**

Create `/home/agenti/my-mvp-slack/database/seed.sql`:

```sql
-- Insert test users
INSERT INTO users (email, username, display_name, status) VALUES
('alice@chatflow.local', 'alice', 'Alice Developer', 'online'),
('bob@chatflow.local', 'bob', 'Bob Backend', 'online'),
('charlie@chatflow.local', 'charlie', 'Charlie Frontend', 'away')
ON CONFLICT DO NOTHING;

-- Insert test workspace
INSERT INTO workspaces (name, owner_id) 
SELECT 'ChatFlow MVP Workspace', id FROM users WHERE username = 'alice'
ON CONFLICT DO NOTHING;

-- Insert test channel
INSERT INTO channels (workspace_id, name, creator_id, is_private)
SELECT w.id, 'general', u.id, FALSE 
FROM workspaces w, users u 
WHERE w.name = 'ChatFlow MVP Workspace' AND u.username = 'alice'
ON CONFLICT DO NOTHING;

-- Insert test message
INSERT INTO messages (channel_id, user_id, content)
SELECT c.id, u.id, 'Welcome to ChatFlow MVP! 🚀'
FROM channels c, users u 
WHERE c.name = 'general' AND u.username = 'alice'
ON CONFLICT DO NOTHING;
```

**Execute:**

```bash
psql -h localhost -U chatflow_app -d chatflow_mvp < seed.sql

# Verify data inserted:
psql -h localhost -U chatflow_app -d chatflow_mvp -c "SELECT * FROM users LIMIT 5;"
psql -h localhost -U chatflow_app -d chatflow_mvp -c "SELECT * FROM messages LIMIT 5;"
```

**Deliverable:** ✅ Test data inserted, connectivity verified.

---

### **Phase 5: Document Connection String for Backend (10 min)**

**Task 5.1: Create .env.database file**

Create `/home/agenti/my-mvp-slack/.env.database`:

```
# PostgreSQL Connection Details (for Node.js Backend)

# Connection String (for libraries like pg or Sequelize)
DATABASE_URL=postgresql://chatflow_app:chatflow_app_secure_pwd_456@localhost:5432/chatflow_mvp

# Individual parameters (for drivers that need them)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatflow_mvp
DB_USER=chatflow_app
DB_PASSWORD=chatflow_app_secure_pwd_456

# Connection pool settings (recommended)
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# Query settings
DB_STATEMENT_TIMEOUT=30000  # 30 seconds max per query
```

**Copy to both backend and test directories:**

```bash
cp /home/agenti/my-mvp-slack/.env.database /home/agenti/my-mvp-slack/backend/
cp /home/agenti/my-mvp-slack/.env.database /home/agenti/my-mvp-slack/tests/
```

**Deliverable:** ✅ Connection strings documented and copied to all directories.

---

## ✅ ACCEPTANCE CRITERIA

- [x] PostgreSQL 15 installed and running on port 5432
- [x] `chatflow_mvp` database created
- [x] `chatflow_app` user created with secure password
- [x] All 11 tables created with proper constraints and relationships
- [x] 30+ indexes created for performance optimization
- [x] Materialized views for dashboard stats
- [x] Triggers and functions for automatic timestamp updates
- [x] Full-text search indexes on messages
- [x] Test data inserted (3 users, 1 workspace, 1 channel, 1 message)
- [x] Connectivity verified from local psql
- [x] Connection string documented in `.env.database`
- [x] Backend team can connect using DATABASE_URL or individual parameters
- [x] No errors in schema creation or migrations
- [x] All indexes listed and explained in documentation

---

## 📁 DELIVERABLES CHECKLIST

```
✅ /home/agenti/my-mvp-slack/database/
   ├── schema.sql              (Complete database schema)
   ├── seed.sql                (Test data insertion)
   └── README.md               (Setup instructions)

✅ /home/agenti/my-mvp-slack/
   └── .env.database           (Connection strings)

✅ DOCUMENTATION
   ├── tables_description.md   (11 tables explained)
   ├── indexes_explained.md    (30+ indexes purpose)
   ├── connection_guide.md     (For Node.js backend)
   └── troubleshooting.md      (Common issues & fixes)
```

---

## 📞 ESCALATION & SUPPORT

**If any issues arise:**

1. **Connection refused (port 5432)**
   - Check: `sudo systemctl status postgresql`
   - Restart: `sudo systemctl restart postgresql`

2. **Authentication failed**
   - Verify password: `sudo -u postgres psql -c "\du"`
   - Reset password: `sudo -u postgres psql -c "ALTER USER chatflow_app WITH PASSWORD 'new_pwd';"`

3. **Permission denied**
   - Reapply grants: `sudo -u postgres psql -d chatflow_mvp -c "GRANT ALL ON SCHEMA public TO chatflow_app;"`

4. **Tables not creating**
   - Check syntax: `psql -h localhost -U chatflow_app -d chatflow_mvp -f schema.sql 2>&1 | head -50`
   - Post error in team chat for supervisor review

---

## 🎯 SUCCESS CRITERIA

**Database is production-ready when:**

```bash
# Run this command - should return all tables with no errors:
psql -h localhost -U chatflow_app -d chatflow_mvp \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" \
  -c "SELECT indexname FROM pg_indexes WHERE schemaname='public';" \
  -c "SELECT count(*) FROM users;" \
  -c "SELECT count(*) FROM messages;"

# All should return successfully with data
```

---

## 📝 SIGN-OFF

**When complete, submit:**

1. Output of `\dt` command (all tables listed)
2. Output of `SELECT count(*) FROM information_schema.tables WHERE table_schema='public';` (should be 11)
3. Confirmation message: "Database setup complete and ready for Node.js backend integration"
4. Connection tested from backend repo (if available)

---

**Estimated Total Time:** 2-3 hours  
**Difficulty Level:** Medium  
**Priority:** 🔴 HIGH - Blocking backend development

---

*Prompt created by Senior Architect - v1.0*  
*Last Updated: 2025-12-05*
