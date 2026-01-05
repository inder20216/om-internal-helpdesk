# 🚀 Step-by-Step Local Setup Guide

## ✅ Your Azure App is Already Configured!

**Client ID:** 9794cd80-12fe-4aef-9f61-269d26010a13
**Permissions:** Granted ✓
**Redirect URIs:** localhost:3000 & GitHub Pages ✓

---

## 📋 Step 1: Extract the Dashboard Folder

1. Download and extract the `sharepoint-dashboard` folder
2. Place it somewhere easy to find (e.g., Desktop or Documents)
3. Remember the location!

---

## 📋 Step 2: Open Command Prompt / Terminal

### Windows:
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter

### Mac:
1. Press `Cmd + Space`
2. Type: `Terminal`
3. Press Enter

---

## 📋 Step 3: Navigate to Dashboard Folder

In Command Prompt/Terminal, type:

```bash
cd path/to/sharepoint-dashboard
```

**Example:**
```bash
# Windows
cd C:\Users\YourName\Desktop\sharepoint-dashboard

# Mac/Linux
cd ~/Desktop/sharepoint-dashboard
```

**Pro Tip:** 
- On Windows: You can drag the folder into Command Prompt to auto-fill the path!
- On Mac: Type `cd ` (with space), then drag the folder into Terminal

---

## 📋 Step 4: Install Dependencies

Once you're in the dashboard folder, type:

```bash
npm install
```

Press Enter and wait. You'll see:
- Lots of text scrolling
- "Added XXX packages"
- Takes about 1-2 minutes

**If you see an error about npm not found:**
- Install Node.js from: https://nodejs.org/
- Download the LTS version
- Restart Command Prompt after installing

---

## 📋 Step 5: Start the Dashboard

After installation completes, type:

```bash
npm run dev
```

Press Enter.

**You'll see:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  press h + enter to show help
```

---

## 📋 Step 6: Open in Browser

The dashboard should automatically open in your browser!

If it doesn't:
1. Open your browser manually
2. Go to: http://localhost:3000

---

## 🎉 Step 7: Test It!

1. You'll see a login page: "IT Helpdesk Dashboard - Powered by Open Mind Services Limited"
2. Click **"Sign in with Microsoft"**
3. A popup will appear
4. Sign in with your Open Mind Services account
5. Accept the permissions
6. **BOOM!** 🎉 Dashboard loads!

---

## 📊 What You Should See:

- **Top:** Company branding, notification bell, your name
- **Filters:** Date range and department dropdown
- **Cards:** Department stats with average resolution time
- **Charts:** Priority distribution and top ticket reasons
- **Table:** All your tickets with click-to-edit status!

---

## 🔍 Test the Features:

1. **Filter by Date:** Change start/end dates → data updates
2. **Filter by Department:** Select IT Team/HR Team/MIS Team
3. **Update Status:** Click any status dropdown in the table → select new status → see success message!
4. **Watch Auto-Refresh:** New tickets appear automatically (every 30 seconds)
5. **Notification Bell:** Shows count of new tickets

---

## 🐛 Troubleshooting:

### "Failed to load tickets"
- Check SharePoint permissions
- Verify you're logged in with correct account
- Check browser console (F12) for errors

### Login popup blocked
- Allow popups for localhost:3000
- Try in Incognito/Private mode

### Port already in use
- Close any other apps using port 3000
- Or change port in `vite.config.js`

---

## ⏹️ To Stop the Dashboard:

In Command Prompt/Terminal, press:
- **Ctrl + C** (Windows/Mac/Linux)
- Type `Y` if asked to confirm

---

## 🎯 Next Steps After Testing:

Once everything works locally:
1. We'll deploy to GitHub Pages
2. Update the dashboard if needed
3. Share with your team!

---

**Questions? Issues? Let me know!** 🚀
