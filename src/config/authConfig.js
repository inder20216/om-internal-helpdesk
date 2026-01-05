export const msalConfig = {
  auth: {
    clientId: "9794cd80-12fe-4aef-9f61-269d26010a13",
    authority: "https://login.microsoftonline.com/6fdaec79-e728-4214-a3c4-8f28e5839ffc",
    redirectUri: "https://inder20216.github.io/om-internal-helpdesk/",
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
  listId: "",
};