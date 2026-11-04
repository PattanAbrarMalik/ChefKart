# Deploying ChefKart to Render (Complete Step-by-Step Guide)

This guide takes you through deploying the ChefKart platform to **Render** ([render.com](https://render.com)) using the included `render.yaml` Blueprint or manual Web Service setup.

---

## Prerequisites (5 minutes)

1. A **GitHub account** ([github.com](https://github.com))
2. A **Render account** ([render.com](https://render.com) — free tier available)
3. A **MongoDB Atlas cluster** ([mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) — free M0 tier)

---

## Step 1: Set Up MongoDB Atlas (Database)

Render does not host free internal MongoDB instances, so MongoDB Atlas (free tier) is the recommended production database:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Click **Create a Deployment** ➔ choose **M0 (Free)**.
3. Under **Security Quickstart**:
   - Create a database user (e.g. username: `chefkart_admin`, password: save a strong password).
   - Under **Where would you like to connect from?**, select **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Click **Connect** ➔ **Drivers** ➔ **Node.js**.
5. Copy your connection string:
   ```text
   mongodb+srv://chefkart_admin:<password>@cluster0.abcde.mongodb.net/chefkart?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your database user password).*

---

## Step 2: Push Your Code to GitHub

From your local project terminal:

```bash
cd c:\Users\"REENA SULTANA"\Downloads\ChefKart-Week6-Week7-Completed\ChefKart

# Initialize git if not already initialized
git init
git add .
git commit -m "feat: enterprise production release with Render blueprint"

# Link to your new GitHub repository
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

---

## Step 3: Deploy to Render (Blueprint 1-Click Method)

Because the project includes `render.yaml`, Render can configure both services automatically:

1. Open the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** (top right) ➔ select **Blueprint**.
3. Connect your GitHub account and select your **ChefKart repository**.
4. Render will read `render.yaml` and discover two services:
   - **`chefkart-platform`** (Node.js Web Service: React Frontend + Express Backend)
   - **`chefkart-forms`** (Python Flask Web Service)
5. Under **Environment Variables**:
   - `MONGODB_URI`: Paste your MongoDB Atlas connection string from Step 1.
   - `JWT_SECRET`: Leave as auto-generated (Render generates a random 256-bit key automatically).
6. Click **Apply**.
7. Render will automatically build the React Vite bundle, start the Express server, and connect to MongoDB!

---

## Step 4: Alternative Manual Deployment (If not using Blueprint)

If you prefer setting up the web service manually:

1. Click **New +** ➔ **Web Service**.
2. Select your repository.
3. Configure the following fields:
   - **Name**: `chefkart-platform`
   - **Region**: Oregon (or nearest)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Expand **Advanced** ➔ Add Environment Variables:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations & security |
   | `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string |
   | `JWT_SECRET` | *(Click Generate)* | Minimum 32-character encryption key |
   | `TRUST_PROXY` | `true` | Allows Render reverse proxy headers |
   | `SEED_DATA` | `true` | Populates sample chefs & content on first boot |
   | `PORT` | `8000` | Optional (Render injects its own port) |
5. **Health Check Path**: `/api/health`
6. Click **Create Web Service**.

---

## Step 5: Verification & Testing

Once Render shows **Live**:

1. Click your Render URL: `https://chefkart-platform.onrender.com`.
2. Check the health probe:
   ```text
   https://chefkart-platform.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "data": {
       "status": "ok",
       "storage": "mongodb",
       "uptime": 45,
       "timestamp": "2026-11-04T17:30:00.000Z",
       "version": "4.0.0"
     }
   }
   ```
3. Test the interactive UI:
   - Search chefs by city (e.g., Bengaluru, Mumbai, Delhi).
   - Filter by diet (Vegetarian / Both).
   - Register a customer account (`/register`).
   - Book a home chef visit (`/book`).

---

## Step 6: Create an Admin User in Production

To create an administrator account on your live Render deployment:

1. In the Render Dashboard, click your `chefkart-platform` service.
2. Go to the **Shell** tab (interactive container terminal).
3. Run:
   ```bash
   node backend/scripts/create-admin.js
   ```
4. Enter your admin name, email, and password.
5. Log in at `https://your-app.onrender.com/login` and navigate to `/admin` to access the full CMS, enquiries, and chef management console.

---

## Troubleshooting Common Render Issues

| Symptom | Root Cause | Solution |
|---|---|---|
| **Health Check Timeout** | Binding to `127.0.0.1` instead of `0.0.0.0` | Already resolved in `backend/config/env.js`: automatically binds to `0.0.0.0` when `NODE_ENV=production`. |
| **Database Connection Refused** | Atlas IP access list | In MongoDB Atlas Network Access, ensure `0.0.0.0/0` (Allow access from anywhere) is active. |
| **Initial 50-second Delay** | Render Free tier spin-down on inactivity | Free web services sleep after 15 minutes of inactivity; initial wake-up takes ~30-50s. Paid instances ($7/mo) stay always-on. |
| **CORS blocked in browser** | Mismatched `CLIENT_ORIGIN` | By default, CORS allows the app itself. If using a custom domain, set `CLIENT_ORIGIN=https://yourdomain.com`. |

