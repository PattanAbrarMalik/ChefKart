# ChefKart — Enterprise Production Deployment & Operations Guide

This runbook provides complete, step-by-step navigation for deploying the ChefKart multi-service platform into production environments with high availability, security hardening, and zero-downtime rolling updates.

---

## 1. Deployment Architecture Topologies

ChefKart supports three production deployment topologies:

```
[Topology A: Cloud Native Containers]
Client ──► Cloudflare / AWS CloudFront ──► Managed Ingress ──► AWS ECS / GCP Cloud Run (App) ──► MongoDB Atlas

[Topology B: Single / Multi-VM Docker Compose]
Client ──► Nginx Gateway (Port 80/443 + SSL) ──► Docker Bridge ──► App (8000) + Forms (5001) + Mongo (27017)

[Topology C: Bare Metal / PM2 Cluster]
Client ──► Host Nginx ──► PM2 Cluster (Node.js API) + Gunicorn/Uvicorn (Flask) ──► Managed MongoDB
```

---

## 2. Option 1: Docker Compose Production Deployment (Recommended)

This strategy deploys the complete stack—including Nginx edge reverse proxy with caching and rate limiting, the core Node.js application, MongoDB database, and Flask forms microservice—using container isolation.

### Step 1: Clone and Configure Environment

On your production server (Ubuntu 22.04+ / Debian 12):

```bash
# Clone the repository
git clone <YOUR_REPO_URL> chefkart
cd chefkart

# Generate a high-entropy 48-byte cryptographic key for JWT
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")

# Create production environment file
cat <<EOF > .env
NODE_ENV=production
PORT=8000
HOST=0.0.0.0
TRUST_PROXY=true
JWT_SECRET=${JWT_SECRET}
MONGODB_URI=mongodb://mongodb:27017/chefkart
CLIENT_ORIGIN=https://yourdomain.com
SEED_DATA=false
LOG_LEVEL=info
SHUTDOWN_TIMEOUT_MS=15000
FLASK_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
EOF
```

### Step 2: Review Security & Domain in Nginx

Edit `nginx/nginx.conf` and update `server_name` with your registered domain:

```nginx
server_name yourdomain.com www.yourdomain.com;
```

### Step 3: Launch Containers

```bash
# Build and start all services in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# Verify container health
docker compose -f docker-compose.prod.yml ps
```

Expected output:
```text
NAME                   STATUS                   PORTS
chefkart-gateway       Up                       0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
chefkart-core          Up (healthy)             8000/tcp
chefkart-forms-prod    Up                       5001/tcp
chefkart-db            Up (healthy)             27017/tcp
```

### Step 4: Provision Administrator Account

Initialize your secure admin user:

```bash
docker exec -it chefkart-core node backend/scripts/create-admin.js
```

---

## 3. Option 2: Cloud Native Deployment (Render / Railway / Cloud Run)

For serverless cloud platforms with managed SSL and automatic scaling:

### 3.1. Database: MongoDB Atlas
1. Create a free/production cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist your server IPs (or `0.0.0.0/0` with strong authentication).
3. Copy your connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/chefkart?retryWrites=true&w=majority`.

### 3.2. Core Platform: Web Service
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `8000` (or dynamic `$PORT`)
  - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
  - `JWT_SECRET`: `<Minimum 32-character high-entropy secret>`
  - `SEED_DATA`: `false`
  - `CLIENT_ORIGIN`: `https://your-frontend-domain.com`

---

## 4. Option 3: Bare Metal / Linux VM with PM2 & Systemd

### Step 1: Install Node.js, Python, and MongoDB

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx python3-venv

# Global PM2 Process Manager
sudo npm install -g pm2
```

### Step 2: Build and Test

```bash
cd /var/www/chefkart
npm ci
npm run build
npm test
```

### Step 3: Start Services with PM2

Create `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: "chefkart-core",
      script: "backend/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 8000,
        MONGODB_URI: "mongodb://127.0.0.1:27017/chefkart",
      },
    },
    {
      name: "chefkart-forms",
      script: ".venv/bin/python",
      args: "services/forms/app.py",
      env: {
        CHEFKART_FLASK_PORT: 5001,
      },
    },
  ],
};
```

Start and enable automatic startup on boot:

```bash
pm2 start ecosystem.config.cjs
pm2 save
sudo pm2 startup
```

### Step 4: Enable SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically configures auto-renewal and updates the Nginx SSL certificates.

---

## 5. Production Health Probes & Monitoring

The Core API exposes Kubernetes / load-balancer compatible health probes:

### 5.1. Liveness & Readiness Probe
- **URL**: `GET /api/health`
- **Headers**: None required (public)
- **Response**:
```json
{
  "data": {
    "status": "ok",
    "storage": "mongodb",
    "uptime": 12480,
    "timestamp": "2026-11-04T17:00:00.000Z",
    "version": "4.0.0"
  }
}
```

### 5.2. Live Log Auditing
View structured JSON logs in real time:

```bash
# Docker Compose
docker compose -f docker-compose.prod.yml logs -f app

# PM2
pm2 logs chefkart-core --json
```

---

## 6. Zero-Downtime Rolling Update Procedure

When pushing updates to production:

```bash
# 1. Pull latest code
git pull origin main

# 2. Build updated images without taking down traffic
docker compose -f docker-compose.prod.yml build app

# 3. Perform rolling reload
docker compose -f docker-compose.prod.yml up -d --no-deps app

# 4. Verify health probe before pruning old containers
curl -f http://127.0.0.1:8000/api/health || echo "Deployment failed!"
```

---

## 7. Production Hardening Checklist

- [x] **No default secrets**: High-entropy `JWT_SECRET` configured (min 32 characters).
- [x] **Strict CORS**: Origins explicitly restricted via `CLIENT_ORIGIN`.
- [x] **Database Isolation**: Production MongoDB authenticated with dedicated role; test databases prohibited.
- [x] **OWASP Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `HSTS`.
- [x] **Non-Root Execution**: Containerized applications execute under user `chefkart:1001`.
- [x] **Logging Sanitization**: Password hashes, payment details, and full PII excluded from log streams.
- [x] **Rate Limiting**: Per-IP sliding-window throttlers guard authentication and enquiry vectors.

