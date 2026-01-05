import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';

const StatusDetailsModal = ({ ticket, isOpen, onClose, onSave }) => {
  const [statusDetails, setStatusDetails] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setStatusDetails(ticket.statusDetails || '');
    }
  }, [ticket]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(ticket.id, statusDetails);
      onClose();
    } catch (error) {
      console.error('Error saving status details:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Edit Status Details</h3>
              <p className="text-sm text-blue-100 mt-1">{ticket?.ticketTitle || ticket?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Ticket Info */}
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Department:</span>
                <span className="ml-2 text-gray-900">{ticket.department}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Priority:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                  ticket.priority === 'High' ? 'bg-red-100 text-red-700' :
                  ticket.priority === 'Normal' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Status:</span>
                <span className="ml-2 text-gray-900">{ticket.status}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Raised By:</span>
                <span className="ml-2 text-gray-900">{ticket.TicketRaisedBy || ticket.ticketRaisedBy || '-'}</span>
              </div>
            </div>
          </div>

          {/* Status Details Input */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status Details / Remarks
          </label>
          <textarea
            value={statusDetails}
            onChange={(e) => setStatusDetails(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            placeholder="Enter status details, remarks, or updates...

Example:
- Issue identified and being investigated
- Waiting for user response
- Solution implemented, monitoring for 24 hours
- etc."
          />
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            This information will be visible to all team members
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-all font-medium"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusDetailsModal;