import { useState } from 'react';

export default function OfficerDashboard() {
  // Mock data demonstrating AI prioritization
  const [issues, setIssues] = useState([
    { id: 'CVC-1042', title: 'Severe Pest and Insect Surge', category: 'Pest & Insect Infestation', location: 'North Kolkata', priority: 'Critical', aiScore: 96, status: 'Pending' },
    { id: 'CVC-1043', title: 'Water Main Break', category: 'Water Supply', location: 'Park Street', priority: 'High', aiScore: 88, status: 'Dispatched' },
    { id: 'CVC-1044', title: 'Flickering Streetlight', category: 'Electrical', location: 'Salt Lake', priority: 'Low', aiScore: 24, status: 'Pending' }
  ]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-slate-950 text-white px-6 py-4 border-b border-emerald-500 shadow-md flex justify-between items-center">
        <div className="text-xl font-bold flex items-center gap-2">
          🛡️ CivicPulse Command Center
        </div>
        <div className="text-sm font-medium text-slate-400">
          Officer ID: 8849 | <a href="/officer" className="text-emerald-500 hover:text-emerald-400">Secure Logout</a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Active Incident Queue</h1>
            <p className="text-slate-400 mt-2">Issues automatically sorted by AI severity score.</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-sm text-emerald-500 font-bold">
            System Status: Active
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-800 rounded-sm shadow-xl overflow-hidden border border-slate-700">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">AI Score</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Issue Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 bg-slate-800">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">
                    {issue.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-sm ${
                      issue.aiScore > 90 ? 'bg-red-900/50 text-red-400 border border-red-800' :
                      issue.aiScore > 50 ? 'bg-amber-900/50 text-amber-400 border border-amber-800' :
                      'bg-slate-700 text-slate-300 border border-slate-600'
                    }`}>
                      {issue.aiScore}/100
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-white">{issue.title}</div>
                    <div className="text-xs text-slate-400">{issue.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {issue.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-emerald-500 hover:text-emerald-400 font-bold border border-emerald-500/30 px-3 py-1 rounded-sm hover:bg-emerald-500/10 transition-colors">
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}