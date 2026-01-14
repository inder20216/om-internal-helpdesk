import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Save } from 'lucide-react';

const StatusDetailsModal = ({ isOpen, ticket, onClose, onSave }) => {
  const [statusDetails, setStatusDetails] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset statusDetails when ticket changes
  useEffect(() => {
    if (ticket && isOpen) {
      setStatusDetails(ticket.statusDetails || '');
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  const handleSave = async () => {
    console.log('🔍 SAVING STATUS DETAILS:');
    console.log('  Ticket ID Field:', ticket.ticketId);
    console.log('  SharePoint Item ID:', ticket.id);
    console.log('  Current Status Details:', ticket.statusDetails);
    console.log('  New Status Details:', statusDetails);
    
    setSaving(true);
    try {
      await onSave(ticket.id, statusDetails);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Status Details</h2>
                  <p className="text-sm text-indigo-100">{ticket.ticketTitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Ticket Info Grid */}
           <div className="grid grid-cols-3 gap-3 mb-4 bg-indigo-50 p-3 rounded-lg text-sm">
  <div>
    <p className="text-xs text-gray-600 mb-0.5">Ticket ID:</p>
    <p className="font-semibold text-indigo-600">{ticket.ticketId}</p>
  </div>
  <div>
    <p className="text-xs text-gray-600 mb-0.5">Status:</p>
    <p className="font-semibold text-gray-900">{ticket.status}</p>
  </div>
  <div>
    <p className="text-xs text-gray-600 mb-0.5">Priority:</p>
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
      ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
      ticket.priority === 'Low' ? 'bg-green-100 text-green-800' :
      'bg-yellow-100 text-yellow-800'
    }`}>
      {ticket.priority}
    </span>
  </div>
  <div className="col-span-2">
    <p className="text-xs text-gray-600 mb-0.5">Raised By:</p>
    <p className="font-semibold text-gray-900">{ticket.ticketRaisedBy}</p>
  </div>
  <div>
    <p className="text-xs text-gray-600 mb-0.5">Department:</p>
    <p className="font-semibold text-gray-900">{ticket.department || 'IT Team'}</p>
  </div>
</div>

            {/* Ticket Details (Read-Only) */}
            {ticket.ticketDetails && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ticket Details (Original Request)
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.ticketDetails}</p>
                </div>
              </div>
            )}

            {/* Status Details / Remarks (Editable) */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status Details / Remarks
              </label>
              <textarea
                value={statusDetails}
                onChange={(e) => setStatusDetails(e.target.value)}
                placeholder="Enter status details, remarks, or updates...&#10;&#10;Example:&#10;- Issue identified and being investigated&#10;- Waiting for user response&#10;- Solution implemented, monitoring for 24 hours&#10;- etc."
                className="w-full h-48 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex items-start gap-2 mt-2 text-xs text-gray-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>This information will be visible to all team members</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusDetailsModal;