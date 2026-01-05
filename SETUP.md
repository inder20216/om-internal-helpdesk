# 🚀 Quick Setup Guide

## Before You Start
You need **3 things**:
1. Azure AD Admin access (to register app)
2. SharePoint site access
3. Node.js installed (v16 or higher)

---

## ⚡ 5-Minute Setup

### 1️⃣ Register Azure AD App (2 min)

1. Open: https://portal.azure.com
2. Go to: **Azure Active Directory** → **App registrations** → **New registration**
3. Enter:
   - Name: `Ticket Dashboard`
   - Redirect URI: Select "Single-page application (SPA)" → `http://localhost:3000`
4. Click **Register**
5. **COPY** the Application (client) ID shown

### 2️⃣ Add Permissions (1 min)

1. In your new app, click **API permissions** (left menu)
2. Click **+ Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Search and add:
   - ✅ `Sites.ReadWrite.All`
   - ✅ `User.Read`
4. Click **Grant admin consent for [your org]** (top button)

### 3️⃣ Configure App (1 min)

Open `src/config/authConfig.js` and paste your Client ID:

```javascript
clientId: "PASTE-YOUR-CLIENT-ID-HERE"
```

### 4️⃣ Run! (1 min)

```bash
npm install
npm run dev
```

Dashboard opens at: http://localhost:3000

---

## ✅ You're Done!

**What you get:**
- ✨ Live dashboard with auto-refresh
- 🔔 New ticket notifications
- 📊 Beautiful charts and analytics
- ⚡ Click-to-update status
- 🎯 Smart filters by date/department
- 📈 Average resolution time per dept

---

## 🆘 Quick Fixes

**"Failed to load tickets"?**
- Check Client ID is pasted correctly
- Verify you granted admin consent for permissions

**Login popup blocked?**
- Allow popups for localhost:3000
- Try incognito mode

**Can't see tickets?**
- Make sure SharePoint list is named exactly: `Tickets Management`
- Verify you have access to: https://openmindservices.sharepoint.com/sites/InternalHelpdesk

---

## 📞 Need Help?

1. Check the full README.md
2. Look at browser console (F12) for errors
3. Verify SharePoint permissions

**Enjoy your new dashboard! 🎉**
