// StudentDashboard.jsx
import React from 'react';

const StudentDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 1. Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-10">ProjectHub</h1>
        <nav>
          <ul>
            <li className="mb-4 text-blue-300">Overview</li>
            <li className="mb-4 hover:text-blue-300 cursor-pointer">Milestones</li>
            <li className="mb-4 hover:text-blue-300 cursor-pointer">Tasks</li>
            <li className="mb-4 hover:text-blue-300 cursor-pointer">Meetings</li>
          </ul>
        </nav>
      </aside>

      {/* 2. Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">Student Dashboard</h2>
          <div className="flex items-center space-x-4">
            <span>Team Alpha</span>
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          </div>
        </header>

        {/* 3. Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Tasks" value="10" color="bg-white" />
          <StatCard title="Completed" value="7" color="bg-white" />
          <StatCard title="Milestones" value="3/5" color="bg-white" />
          <StatCard title="Next Meeting" value="Mar 18" color="bg-white" />
        </div>

        {/* 4. Progress Section (Placeholder) */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-bold mb-4">My Progress Over Time</h3>
          <div className="h-40 bg-gray-50 flex items-center justify-center border-dashed border-2">
            [Chart Component Goes Here]
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
    <p className="text-gray-500 text-sm">{title}</p>
    <p className="text-2xl font-bold text-indigo-900">{value}</p>
  </div>
);

export default StudentDashboard;