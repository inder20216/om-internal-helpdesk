import axios from 'axios';

class SharePointService {
  constructor() {
    this.siteId = null;
    this.listId = null;
    this.accessToken = null;
    this.userInfoListId = null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async getSiteId() {
    if (this.siteId) return this.siteId;

    try {
      const hostname = 'openmindservices.sharepoint.com';
      const sitePath = '/sites/InternalHelpdesk';
      
      const url = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}`;
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      this.siteId = response.data.id;
      return this.siteId;
    } catch (error) {
      console.error('Error getting site ID:', error);
      throw error;
    }
  }

  async getListId() {
    if (this.listId) return this.listId;

    try {
      const siteId = await this.getSiteId();
      const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists?$filter=displayName eq 'Tickets Management'`;
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      if (response.data.value && response.data.value.length > 0) {
        this.listId = response.data.value[0].id;
        return this.listId;
      }
      throw new Error('List not found');
    } catch (error) {
      console.error('Error getting list ID:', error);
      throw error;
    }
  }

  async getUserInfoListId() {
    if (this.userInfoListId) return this.userInfoListId;

    try {
      const siteId = await this.getSiteId();
      const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists?$filter=displayName eq 'User Information List'`;
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      if (response.data.value && response.data.value.length > 0) {
        this.userInfoListId = response.data.value[0].id;
        console.log('✅ Found User Information List');
        return this.userInfoListId;
      }
    } catch (error) {
      console.log('⚠️ Could not find User Information List');
    }
    
    return null;
  }

  async getUserName(lookupId) {
    try {
      const siteId = await this.getSiteId();
      const userInfoListId = await this.getUserInfoListId();
      
      if (!userInfoListId) {
        return null;
      }

      const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${userInfoListId}/items/${lookupId}?$expand=fields`;
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      return response.data.fields.Title || 
             response.data.fields.Name || 
             response.data.fields.EMail ||
             null;
    } catch (error) {
      return null;
    }
  }

  async getTickets(filters = {}) {
    try {
      const siteId = await this.getSiteId();
      const listId = await this.getListId();
      
      let url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=1000`;
      
      console.log('\n🔍 ═══════════════════════════════════════════════════════════');
      console.log('🔍 Fetching tickets from SharePoint...');
      const response = await axios.get(url, { headers: this.getHeaders() });
      console.log(`📊 Retrieved ${response.data.value.length} items`);
      
      const authorIds = [...new Set(
        response.data.value
          .map(item => item.fields.AuthorLookupId)
          .filter(id => id)
      )];
      
      console.log(`👥 Found ${authorIds.length} unique users, fetching names...`);
      
      const userNames = {};
      const idsToFetch = authorIds.slice(0, 30);
      
      for (const id of idsToFetch) {
        const name = await this.getUserName(id);
        if (name) {
          userNames[id] = name;
        }
      }
      
      console.log(`✅ Successfully fetched ${Object.keys(userNames).length} user names`);
      
      const tickets = response.data.value.map((item) => {
        const fields = item.fields;
        
        let ticketRaisedBy = '';
        if (fields.AuthorLookupId && userNames[fields.AuthorLookupId]) {
          ticketRaisedBy = userNames[fields.AuthorLookupId];
        } else if (fields.AuthorLookupId) {
          ticketRaisedBy = `User ID: ${fields.AuthorLookupId}`;
        } else {
          ticketRaisedBy = 'Not specified';
        }
        
        const ticketId = fields.TicketID || fields.Ticket_x0020_ID || '';
        const ticketTitle = fields.TicketTitle || fields.Ticket_x0020_Title || fields.Title || '';
        const ticketReason = fields.TicketReason || fields.Ticket_x0020_Reason || '';
        const statusDetails = fields.StatusDetails || fields.Status_x0020_Details || '';
        
        return {
          id: item.id,
          title: fields.Title,
          ticketTitle: ticketTitle,
          ticketId: ticketId,
          createdDate: fields.Created || item.createdDateTime,
          department: fields.Department,
          ticketReason: ticketReason,
          ticketRaisedBy: ticketRaisedBy,
          priority: fields.Priority,
          status: fields.Status,
          statusDetails: statusDetails,
          modifiedDate: fields.Modified || item.lastModifiedDateTime,
          authorLookupId: fields.AuthorLookupId
        };
      });

      let filteredTickets = tickets;
      
      if (filters.department) {
        filteredTickets = filteredTickets.filter(t => t.department === filters.department);
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredTickets = filteredTickets.filter(t => new Date(t.createdDate) >= startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59);
        filteredTickets = filteredTickets.filter(t => new Date(t.createdDate) <= endDate);
      }

      filteredTickets.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

      console.log(`\n✅ Processed ${filteredTickets.length} tickets (after filters)`);
      if (filteredTickets.length > 0) {
        console.log('\n📋 Sample Tickets:');
        filteredTickets.slice(0, 3).forEach(ticket => {
          console.log(`  ${ticket.ticketId}: ${ticket.ticketRaisedBy} - ${ticket.status}`);
        });
      }
      console.log('🔍 ═══════════════════════════════════════════════════════════\n');

      return filteredTickets;
    } catch (error) {
      console.error('❌ Error fetching tickets:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateTicketStatus(ticketId, newStatus) {
    try {
      const siteId = await this.getSiteId();
      const listId = await this.getListId();
      
      const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${ticketId}/fields`;
      
      await axios.patch(url, {
        Status: newStatus
      }, {
        headers: this.getHeaders()
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error updating status:', error);
      throw error;
    }
  }

  async updateStatusDetails(ticketId, statusDetails) {
    try {
      const siteId = await this.getSiteId();
      const listId = await this.getListId();
      
      const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${ticketId}/fields`;
      
      await axios.patch(url, {
        StatusDetails: statusDetails
      }, {
        headers: this.getHeaders()
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error updating details:', error);
      throw error;
    }
  }

  calculateAvgResolutionTime(tickets) {
    const resolvedTickets = tickets.filter(t => {
      const status = t.status?.toLowerCase() || '';
      return (status === 'resolved' || status === 'closed') && t.createdDate && t.modifiedDate;
    });

    if (resolvedTickets.length === 0) return '0';

    const totalHours = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.createdDate);
      const resolved = new Date(ticket.modifiedDate);
      const hours = (resolved - created) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return (totalHours / resolvedTickets.length).toFixed(1);
  }

  groupTicketsByCategory(tickets, category) {
    const grouped = {};
    tickets.forEach(ticket => {
      const key = ticket[category.toLowerCase()] || 'Unknown';
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }
}

export default new SharePointService();