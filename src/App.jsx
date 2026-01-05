import React, { useState } from 'react';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './config/authConfig';
import { getDepartmentsForEmail, hasAccess } from './config/departmentConfig';
import Dashboard from './components/Dashboard';
import DepartmentSelector from './components/DepartmentSelector';
import { ShieldAlert, FileText, LogOut } from 'lucide-react';

const msalInstance = new PublicClientApplication(msalConfig);

function AppContent() {
  const { instance, accounts } = useMsal();
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const handleLogin = () => {
    instance.loginPopup({
      scopes: ['Sites.ReadWrite.All', 'User.Read']
    }).catch(e => {
      console.error(e);
    });
  };

  // Get user's departments
  const userEmail = accounts[0]?.username?.toLowerCase();
  const userDepartments = userEmail ? getDepartmentsForEmail(userEmail) : [];
  const userName = accounts[0]?.name || 'User';

  // Check if user has access
  if (accounts.length > 0 && !hasAccess(userEmail)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center border border-red-200 animate-slideUp">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this dashboard.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                Logged in as:
              </p>
              <p className="text-sm font-semibold text-red-600 mt-1">
                {userEmail}
              </p>
            </div>
            <button
              onClick={() => instance.logout()}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mx-auto shadow-lg shadow-red-500/30"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show department selector if user has multiple departments and hasn't selected one
  if (accounts.length > 0 && userDepartments.length > 1 && !selectedDepartment) {
    return (
      <DepartmentSelector
        departments={userDepartments}
        onSelectDepartment={setSelectedDepartment}
        userName={userName}
      />
    );
  }

  // Auto-select department if user only has one
  const activeDepartment = selectedDepartment || (userDepartments.length === 1 ? userDepartments[0] : null);

  return (
    <AuthenticatedTemplate>
      {activeDepartment ? (
        <Dashboard department={activeDepartment} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}
    </AuthenticatedTemplate>
  );
}

function App() {
  const handleLogin = () => {
    msalInstance.loginPopup({
      scopes: ['Sites.ReadWrite.All', 'User.Read']
    }).catch(e => {
      console.error(e);
    });
  };

  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
      
      <UnauthenticatedTemplate>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center border border-gray-200 animate-slideUp">
            {/* Logo/Icon */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Helpdesk Tickets Dashboard
              </h1>
              <p className="text-gray-600">Powered by Open Mind Services Limited</p>
            </div>
            
            {/* Info */}
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <p className="text-gray-700 text-sm font-medium mb-2">
                🔐 Secure Microsoft Authentication
              </p>
              <p className="text-gray-600 text-xs">
                Sign in with your official Microsoft account to access your department's dashboard
              </p>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg shadow-blue-500/30 group"
            >
              <svg className="w-6 h-6" viewBox="0 0 23 23" fill="currentColor">
                <path d="M0 0h10v10H0z" fill="#f25022"/>
                <path d="M12 0h10v10H12z" fill="#7fba00"/>
                <path d="M0 12h10v10H0z" fill="#00a4ef"/>
                <path d="M12 12h10v10H12z" fill="#ffb900"/>
              </svg>
              <span className="text-lg">Sign in with Microsoft</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 font-medium">Real-time</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 font-medium">Analytics</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 font-medium">Secure</p>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-8 text-xs text-gray-500">
              Protected by Microsoft Azure AD
            </p>
          </div>
        </div>
      </UnauthenticatedTemplate>
    </MsalProvider>
  );
}

export default App;