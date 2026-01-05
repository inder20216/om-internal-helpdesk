import React from 'react';
import { Building2, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { getDepartmentColor } from '../config/departmentConfig';

const DepartmentSelector = ({ departments, onSelectDepartment, userName }) => {
  const getDepartmentIcon = (dept) => {
    const icons = {
      'IT Team': TrendingUp,
      'HR Team': Users,
      'MIS Team': Building2,
    };
    const Icon = icons[dept] || Building2;
    return <Icon className="w-12 h-12" />;
  };

  const getDepartmentGradient = (dept) => {
    const gradients = {
      'IT Team': 'from-blue-500 to-cyan-500',
      'HR Team': 'from-purple-500 to-pink-500',
      'MIS Team': 'from-orange-500 to-yellow-500',
    };
    return gradients[dept] || 'from-gray-500 to-gray-700';
  };

  const getDepartmentDescription = (dept) => {
    const descriptions = {
      'IT Team': 'Technical support & infrastructure',
      'HR Team': 'Human resources & administration',
      'MIS Team': 'Management information systems',
    };
    return descriptions[dept] || 'Department dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mb-6 shadow-lg shadow-blue-500/30">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome, <span className="text-blue-600">{userName}</span>! 👋
          </h1>
          <p className="text-gray-600 text-lg mb-2">Select your department to continue</p>
                  </div>

        {/* Department Cards */}
        <div className={`grid ${departments.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => onSelectDepartment(dept)}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-200 overflow-hidden"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getDepartmentGradient(dept)} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative p-8">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${getDepartmentGradient(dept)} rounded-xl mb-4 shadow-lg`}>
                  <div className="text-white">
                    {getDepartmentIcon(dept)}
                  </div>
                </div>

                {/* Text */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{dept}</h2>
                <p className="text-gray-600 text-sm mb-4">{getDepartmentDescription(dept)}</p>

                {/* Arrow */}
                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                  <span>Access Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bottom Border */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${getDepartmentGradient(dept)}`}></div>
            </button>
          ))}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">About Your Dashboard</h3>
              <p className="text-sm text-gray-600">
                You have access to {departments.length} department{departments.length > 1 ? 's' : ''}. 
                Each dashboard provides real-time ticket management, analytics, and reporting capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentSelector;