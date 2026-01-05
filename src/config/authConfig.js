export const msalConfig = {
  auth: {
    clientId: "9794cd80-12fe-4aef-9f61-269d26010a13", // Your Azure AD App Client ID
    authority: "https://login.microsoftonline.com/6fb82fad-19c7-41e5-b5e1-e7e1b02b0323",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["Sites.ReadWrite.All", "User.Read"]
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

// SharePoint Site Configuration
export const sharepointConfig = {
  siteUrl: "https://openmindservices.sharepoint.com/sites/InternalHelpdesk",
  listName: "Tickets Management",
  listId: "", // Will be auto-detected
};