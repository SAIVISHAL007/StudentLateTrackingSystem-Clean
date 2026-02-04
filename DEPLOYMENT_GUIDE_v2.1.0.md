# 🚀 Deployment Guide - Student Late Tracking System v2.1.0

## Pre-Deployment Checklist

- [ ] All code committed and pushed to GitHub (main branch)
- [ ] Both frontend and backend build successfully locally
- [ ] MongoDB Atlas account created and cluster set up
- [ ] Vercel account created (free tier available)
- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] All environment variables documented
- [ ] Default passwords changed in database
- [ ] Strong JWT_SECRET generated (min 32 characters)
- [ ] CORS origins configured for production domain

---

## Part 1: MongoDB Atlas Setup (if not done)

### 1. Create MongoDB Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in or create account
3. Create a new project: `StudentLateTrackingSystem`
4. Click "Build a Database" → Choose "M0 Cluster" (free tier)
5. Select region closest to you
6. Create cluster (takes 2-3 minutes)

### 2. Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username: `appuser`
5. Set strong password (save this!)
6. Add privileges: `readWriteAnyDatabase`

### 3. Get Connection String
1. Go to "Database" → "Clusters"
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<username>` with `appuser`
6. Replace `<password>` with your password
7. Save this connection string (you'll need it for Vercel)

**Connection String Format:**
```
mongodb+srv://appuser:YOUR_PASSWORD@cluster-name.mongodb.net/attendanceDB?retryWrites=true&w=majority
```

### 4. Configure IP Whitelist
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (for Vercel)
   - Or add Vercel IP if you know it: `76.75.126.0/24` (Vercel's IPs)

---

## Part 2: Backend Deployment on Vercel

### Step 1: Login to Vercel
```bash
vercel login
# You'll be prompted to create/log into Vercel account
```

### Step 2: Deploy Backend
```bash
cd backend
vercel --prod
```

You'll be asked:
- **"Set up and deploy?"** → Choose `y`
- **"Link to existing project?"** → Choose `n` (new project)
- **"Project name?"** → Enter `StudentLateTrackingSystem-backend`
- **"Which scope?"** → Choose your account
- **"Detected framework?"** → Choose `Node.js`

### Step 3: Configure Environment Variables in Vercel
1. After deployment succeeds, go to Vercel dashboard
2. Select your backend project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
MONGODB_URI = mongodb+srv://appuser:YOUR_PASSWORD@cluster-name.mongodb.net/attendanceDB?retryWrites=true&w=majority
JWT_SECRET = your-super-secret-key-min-32-characters-long-please
NODE_ENV = production
FRONTEND_URL = https://your-frontend-domain.vercel.app
```

**Generate Strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Click "Save"

### Step 4: Redeploy Backend (to apply env vars)
```bash
cd backend
vercel --prod
```

### Step 5: Test Backend API
```bash
# Copy your backend URL from Vercel dashboard
# Should be: https://studentlatetrackingsystem-backend.vercel.app

# Test the API
curl https://your-backend-url.vercel.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json"
```

You should get a validation error (no credentials provided), which means the API is working!

---

## Part 3: Frontend Deployment on Vercel

### Step 1: Deploy Frontend
```bash
cd frontend
vercel --prod
```

You'll be asked:
- **"Set up and deploy?"** → Choose `y`
- **"Link to existing project?"** → Choose `n` (new project)
- **"Project name?"** → Enter `StudentLateTrackingSystem-frontend`
- **"Which scope?"** → Choose your account
- **"Directory?"** → Leave empty (default is frontend root)

### Step 2: Configure Frontend Environment Variables
1. Go to Vercel dashboard
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:

```
REACT_APP_API_URL = https://your-backend-url.vercel.app/api
```

Example:
```
REACT_APP_API_URL = https://studentlatetrackingsystem-backend.vercel.app/api
```

5. Click "Save"

### Step 3: Redeploy Frontend
```bash
cd frontend
vercel --prod
```

### Step 4: Test Frontend
- Open your frontend URL in browser (from Vercel dashboard)
- You should see the login page with the eye+clock favicon
- Try logging in with test credentials from login page

---

## Part 4: GitHub Integration (Optional but Recommended)

This enables automatic deployment on every GitHub push to main branch.

### For Backend Project:
1. Go to Vercel Dashboard → Backend Project
2. Go to **Settings** → **Git**
3. Click "Connect Git Repository"
4. Select your GitHub repository: `StudentLateTrackingSystem-Clean`
5. Set **Root Directory**: `backend`
6. Click "Deploy"

### For Frontend Project:
1. Go to Vercel Dashboard → Frontend Project
2. Go to **Settings** → **Git**
3. Click "Connect Git Repository"
4. Select your GitHub repository: `StudentLateTrackingSystem-Clean`
5. Set **Root Directory**: `frontend`
6. Click "Deploy"

Now every push to main branch will trigger automatic deployment!

---

## Part 5: Post-Deployment Testing

### Test 1: Login Functionality
1. Open frontend URL
2. Use test credentials from login page
3. Should redirect to "Mark Student Late" page
4. Avatar should show your name in top-right

### Test 2: Faculty Features
- Mark Student Late:
  - Search for a student (e.g., "21A91A05H3")
  - Click "Mark Late"
  - Should show student details and fine calculation

- View Late Records:
  - Select "Late Records"
  - Should display records with filters
  - Try exporting to Excel

### Test 3: Admin Features (if admin account)
- Student Master Data:
  - Should be accessible from sidebar
  - Can add/edit students

- Faculty Directory:
  - View all faculty
  - Create new faculty account (test role selection)

- Admin Management:
  - View system statistics
  - Test semester promotion (with test data)

### Test 4: Offline Functionality
1. Open DevTools (F12)
2. Go to **Network** tab
3. Toggle "Offline"
4. Try marking a student late
5. Should queue operation offline
6. Toggle online
7. Should auto-sync and show success

### Test 5: Performance
```bash
# Check frontend performance
curl -I https://your-frontend-url.vercel.app

# Check backend response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-backend-url.vercel.app/api/auth/profile
```

---

## Common Issues & Solutions

### Issue 1: Backend API 502/503 Error
**Cause:** Environment variables not set or MongoDB connection failing

**Solution:**
```bash
# Re-check environment variables in Vercel dashboard
# Ensure MONGODB_URI is correct
# Re-deploy with: vercel --prod
```

### Issue 2: Frontend Can't Connect to Backend
**Cause:** REACT_APP_API_URL not pointing to correct backend

**Solution:**
```bash
# Check frontend environment variables
# REACT_APP_API_URL should match your backend URL exactly
# Re-deploy frontend after updating
```

### Issue 3: Login Page Shows "Cannot GET /api/auth/login"
**Cause:** Backend routes not working

**Solution:**
1. Check backend vercel.json is correct
2. Ensure api/index.js exports the Express app
3. Check MongoDB connection string

### Issue 4: Fine Calculation Wrong
**Cause:** Backend timezone or fine rates misconfigured

**Solution:**
1. Check backend model fine calculation logic
2. Ensure server time is correct
3. Verify database schema

### Issue 5: Favicon Not Showing
**Cause:** Browser cache

**Solution:**
```bash
# Hard refresh in browser
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)
# Or clear browser cache
```

---

## Monitoring & Maintenance

### Enable Error Tracking
1. Vercel Dashboard → Settings → Monitoring
2. Check "Function Logs" for errors
3. Review "Performance" metrics

### Monitor Database
1. MongoDB Atlas → Monitoring → Metrics
2. Check query performance
3. Review storage usage

### Check Logs
```bash
# View backend logs
vercel logs your-backend-project

# View frontend logs
vercel logs your-frontend-project
```

---

## Security Checklist for Production

- [ ] Change default admin password
- [ ] Change JWT_SECRET from test value
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Configure CORS properly
- [ ] Restrict MongoDB IP whitelist if possible
- [ ] Enable rate limiting on API
- [ ] Set up monitoring and alerts
- [ ] Regular backup of MongoDB
- [ ] Audit log review process

---

## Rollback Instructions

If deployment has critical issues:

### Rollback Frontend
```bash
cd frontend
vercel rollback
# Choose previous deployment
```

### Rollback Backend
```bash
cd backend
vercel rollback
# Choose previous deployment
```

Or manually redeploy previous version from Git:
```bash
git checkout previous-commit-hash
vercel --prod
```

---

## Performance Optimization Tips

### Frontend
- Enable gzip compression (automatic on Vercel)
- Use service worker caching (already configured)
- Lazy load components
- Optimize images

### Backend
- Add database indexes
- Implement caching for frequently accessed data
- Use pagination for large datasets
- Optimize queries

### Database
- Create indexes on frequently queried fields
- Archive old audit logs periodically
- Monitor slow queries

---

## Support & Troubleshooting

If you encounter issues:

1. **Check Vercel Status:** https://www.vercel.com/status
2. **Check MongoDB Status:** https://status.mongodb.com/
3. **Review Vercel Logs:** `vercel logs your-project`
4. **Check Browser Console:** F12 → Console tab
5. **Check Network Tab:** F12 → Network tab

### Get Help
- Vercel Support: https://vercel.com/support
- MongoDB Support: https://docs.mongodb.com/
- GitHub Issues: Create issue on your repository

---

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Monitor performance for 24 hours
3. ✅ Set up alerts for errors
4. ✅ Train users on the system
5. ✅ Create backup and disaster recovery plan
6. ✅ Document any custom configurations
7. ✅ Plan for future updates/maintenance

---

## Useful Commands Reference

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# View live logs
vercel logs project-name

# Rollback to previous deployment
vercel rollback

# List deployments
vercel list

# View environment variables
vercel env list

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# Remove a project
vercel remove project-name

# View project info
vercel projects
```

---

## Version Information

- **Application Version:** v2.1.0
- **React Version:** 19.0.0
- **Node Version:** 16.x (Vercel compatible)
- **MongoDB Version:** Latest (Atlas)
- **Deployment Platform:** Vercel (Serverless)

---

**Deployment Status:** ✅ Ready for Production

Made with ❤️ by Chelluri Sai Vishal
