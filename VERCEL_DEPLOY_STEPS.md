# 🚀 Vercel Deployment Guide

## ✅ Pre-Deployment Checklist
- [x] MongoDB Atlas connection string configured
- [x] JWT_SECRET generated and set
- [x] Vercel account ready
- [x] Code cleaned and optimized

---

## 📋 Step-by-Step Deployment

### Step 1: Create New GitHub Repository

Run these commands in PowerShell:

```powershell
# Initialize git (if not already done)
cd C:\StudentLateTrackingSystem-Clean
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Ready for Vercel deployment"

# Create new repo on GitHub (you'll need to do this manually):
# Go to https://github.com/new
# Repository name: student-late-tracking-system
# Description: College Late Tracking System with QR Scanner
# Public or Private: Your choice
# DO NOT initialize with README (we already have one)

# After creating the repo, link it:
git remote add origin https://github.com/SAIVISHAL007/student-late-tracking-system.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Backend to Vercel

```powershell
# Navigate to backend folder
cd backend

# Deploy to Vercel (follow prompts)
vercel --prod

# When prompted:
# - Set up and deploy? Y
# - Which scope? (Select your account)
# - Link to existing project? N
# - Project name? student-late-backend (or your choice)
# - Directory? ./
# - Override settings? N
```

**⚠️ Important: After deployment, note the backend URL (e.g., `https://student-late-backend.vercel.app`)**

---

### Step 3: Configure Backend Environment Variables on Vercel

Go to: https://vercel.com/dashboard → Your Backend Project → Settings → Environment Variables

Add these variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://chellurisaivishal23csm_db_user:GJ3kvdi2a05OOZs9@cluster0.8dnjylh.mongodb.net/attendanceDB` |
| `JWT_SECRET` | `1f66ef3c99ae038ff81d75cba04a7c9592c1b6d84e8759912f2b26aef05304fce66649ea01a499124ca10f1c2edd7288020fbe543f16a6e583a906b5a4a6fb89` |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |

**After adding variables, redeploy:**
```powershell
vercel --prod
```

---

### Step 4: Deploy Frontend to Vercel

```powershell
# Navigate to frontend folder
cd ../frontend

# Deploy to Vercel
vercel --prod

# When prompted:
# - Set up and deploy? Y
# - Which scope? (Select your account)
# - Link to existing project? N
# - Project name? student-late-frontend (or your choice)
# - Directory? ./
# - Override settings? N
```

**⚠️ Important: Note the frontend URL (e.g., `https://student-late-frontend.vercel.app`)**

---

### Step 5: Configure Frontend Environment Variables

Go to: https://vercel.com/dashboard → Your Frontend Project → Settings → Environment Variables

Add these variables:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://your-backend-url.vercel.app/api` (Use your actual backend URL) |
| `GENERATE_SOURCEMAP` | `false` |
| `CI` | `false` |

**After adding variables, redeploy:**
```powershell
vercel --prod
```

---

### Step 6: Update Backend CORS Settings

Update `FRONTEND_URL` in backend environment variables:

1. Go to backend project on Vercel → Settings → Environment Variables
2. Add/Update:
   - `FRONTEND_URL` = `https://your-frontend-url.vercel.app` (Your actual frontend URL)
3. Redeploy backend:
   ```powershell
   cd ../backend
   vercel --prod
   ```

---

## 🎉 Deployment Complete!

### Access Your Application:
- **Frontend**: https://your-frontend-url.vercel.app
- **Backend API**: https://your-backend-url.vercel.app/api

### Test Login Credentials:
- Faculty: `faculty` / `pass123`
- Admin: `admin` / `admin123`

### Next Steps:
1. Test all features (login, student registration, QR scanning, late marking)
2. Create production faculty accounts
3. Import existing student data if needed
4. Share frontend URL with college faculty

---

## 🔧 Useful Commands

```powershell
# View deployment logs
vercel logs

# List all deployments
vercel list

# Remove a deployment
vercel remove [deployment-url]

# Open project dashboard
vercel dashboard
```

---

## ⚠️ Important Notes

1. **MongoDB Atlas**: Ensure your MongoDB Atlas cluster allows connections from all IPs (0.0.0.0/0) for Vercel serverless functions
2. **Environment Variables**: Never commit `.env` files to GitHub
3. **CORS**: Frontend URL is whitelisted in backend CORS config
4. **JWT Secret**: Keep it secure, never share publicly

---

## 🆘 Troubleshooting

### Backend not connecting to MongoDB:
- Check MongoDB Atlas whitelist (allow all IPs: 0.0.0.0/0)
- Verify connection string in Vercel environment variables
- Check Vercel function logs: `vercel logs --prod`

### Frontend cannot reach backend:
- Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is deployed and running

### 500 errors:
- Check Vercel function logs
- Verify all environment variables are set
- Check MongoDB connection

---

**Ready to deploy? Start with Step 1! 🚀**
