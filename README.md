# SharePoint IT Helpdesk Dashboard

A beautiful, real-time dashboard for managing HR & IT tickets from SharePoint with live updates, filters, and inline status editing.

## ✨ Features

- 🔄 **Real-time Data Sync** - Auto-refreshes every 30 seconds
- 🔔 **New Ticket Notifications** - Instant alerts for new tickets
- 📊 **Smart Analytics** - Department-wise stats, charts, and insights
- ⚡ **Quick Status Updates** - Click-to-edit status directly from table
- 🎯 **Dynamic Filters** - Date range and department filtering
- 📈 **Average Resolution Time** - Per department tracking
- 🎨 **Beautiful UI** - Modern, clean, responsive design
- 🔐 **Secure Login** - Microsoft Azure AD authentication

## 🚀 Setup Instructions

### Step 1: Register Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Fill in:
   - **Name**: `SharePoint Ticket Dashboard`
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: 
     - Type: Single-page application (SPA)
     - URI: `http://localhost:3000`
4. Click **Register**
5. Copy the **Application (client) ID** - you'll need this!

### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph**
3. Select **Delegated permissions** and add:
   - `Sites.ReadWrite.All`
   - `User.Read`
4. Click **Add permissions**
5. Click **Grant admin consent** (requires admin rights)

### Step 3: Configure the Application

1. Open `src/config/authConfig.js`
2. Replace `YOUR_CLIENT_ID` with your Application (client) ID from Step 1:

\`\`\`javascript
export const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID_HERE", // Paste your Application (client) ID
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  ...
};
\`\`\`

### Step 4: Install Dependencies

\`\`\`bash
npm install
\`\`\`

### Step 5: Run the Application

\`\`\`bash
npm run dev
\`\`\`

The dashboard will open at `http://localhost:3000`

## 🎯 How It Works

### Authentication Flow
1. User clicks "Sign in with Microsoft"
2. Microsoft login popup appears
3. User authenticates with their organization account
4. App receives access token
5. Dashboard loads with real-time data

### Data Flow
1. **Fetch**: Gets tickets from SharePoint every 30 seconds
2. **Filter**: Applies date range and department filters
3. **Analyze**: Calculates stats, groups data for charts
4. **Display**: Shows in beautiful, interactive UI
5. **Update**: Status changes are saved back to SharePoint

### Features in Action

#### 📊 Dashboard Sections

**Top Bar**
- Company branding
- New ticket notification bell
- User profile info

**Filters Panel**
- Start Date picker
- End Date picker  
- Department dropdown (dynamically populated)

**Department Cards**
- Total tickets per department
- Average resolution time in hours
- Color-coded for quick scanning

**Charts**
- **Priority Distribution** - Pie chart showing High/Normal/Low
- **Top Ticket Reasons** - Bar chart of most common issues

**Tickets Table**
- All ticket details in sortable columns
- **Click-to-Edit Status** - Dropdown in Status column
- Color-coded priority and status badges
- Scrollable with latest tickets first

## 🎨 Customization

### Change Color Theme

Edit `tailwind.config.js` to customize colors:

\`\`\`javascript
colors: {
  brand: {
    600: '#2563eb', // Change primary color
    // Add more shades...
  }
}
\`\`\`

### Modify Refresh Rate

In `Dashboard.jsx`, change the interval (in milliseconds):

\`\`\`javascript
const interval = setInterval(fetchData, 30000); // 30 seconds
// Change to 60000 for 1 minute, 10000 for 10 seconds, etc.
\`\`\`

### Add More Status Options

In `Dashboard.jsx`, update the status dropdown:

\`\`\`javascript
<select value={ticket.status} ...>
  <option>Open</option>
  <option>In Progress</option>
  <option>Pending</option>
  <option>Resolved</option>
  <option>Closed</option>
  // Add more options here
</select>
\`\`\`

## 🐛 Troubleshooting

### "Failed to load tickets" Error
- Check if your Client ID is correct in `authConfig.js`
- Verify API permissions are granted
- Ensure SharePoint site URL is accessible

### Authentication Popup Blocked
- Allow popups in your browser for `localhost:3000`
- Try incognito/private mode

### Data Not Updating
- Check browser console for errors
- Verify SharePoint list name matches exactly: `Tickets Management`
- Ensure you have permissions to the SharePoint site

### CORS Errors
- SharePoint REST API should work from any origin
- If issues persist, you may need to configure SharePoint CORS settings

## 📦 Deployment

### Build for Production

\`\`\`bash
npm run build
\`\`\`

### Deploy Options

1. **SharePoint Site** - Upload to SharePoint site assets
2. **Azure Static Web Apps** - Deploy directly from GitHub
3. **Netlify/Vercel** - Connect your Git repository
4. **IIS/Apache** - Host the build folder

**Important**: Update the redirect URI in Azure AD after deployment!

## 🔐 Security Notes

- Never commit your Client ID if it's sensitive
- Use environment variables for production
- Implement proper role-based access control
- Review Azure AD app permissions regularly

## 📚 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Charts and graphs
- **Azure MSAL** - Microsoft authentication
- **Axios** - HTTP requests
- **React Hot Toast** - Notifications
- **date-fns** - Date formatting

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Verify SharePoint permissions
4. Contact your IT administrator

---

**Built with ❤️ by Open Mind Services Limited**
