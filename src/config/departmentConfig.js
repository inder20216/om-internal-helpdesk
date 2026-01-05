// Email to Department Mapping
export const departmentMapping = {
  // IT Team
  'inder@openmind.in': ['IT Team', 'HR Team'],
  'naveen@openmind.in': ['IT Team', 'HR Team'],
  'ajay@openmind.in': ['IT Team'],
  'amandeep@openmind.in': ['IT Team', 'HR Team'],
  
  // HR Team
  'reena@openmind.in': ['HR Team'],
  'yashika@openmind.in': ['HR Team'],
  'sonia@openmind.in': ['HR Team'],
  'hr@openmind.in': ['HR Team'],
};

// Get departments for a given email
export const getDepartmentsForEmail = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  return departmentMapping[normalizedEmail] || [];
};

// Check if user has access
export const hasAccess = (email) => {
  return getDepartmentsForEmail(email).length > 0;
};

// Get department color
export const getDepartmentColor = (department) => {
  const colors = {
    'IT Team': 'from-blue-600 to-cyan-600',
    'HR Team': 'from-purple-600 to-pink-600',
    'MIS Team': 'from-orange-600 to-yellow-600',
  };
  return colors[department] || 'from-gray-600 to-gray-800';
};