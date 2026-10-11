import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function OfficerDashboard() {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('command-center');
  const [isLoading, setIsLoading] = useState(true);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const navigate = useNavigate();

  // STRICT IPv4 PORT TO BYPASS LOCALHOST BLOCKS
  const baseUrl = 'http://127.0.0.1:5005';

  useEffect(() => {
    fetchUserData();
    fetchAllReports();
  }, []);

  // Initialize and populate Leaflet Map for Officers
  useEffect(() => {
    if (activeTab === 'map' && mapRef.current) {
      if (!mapInstanceRef.current) {
        // Center map on Kolkata/West Bengal area
        const map = L.map(mapRef.current).setView([22.5726, 88.3639], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add markers for all active issues
      issues.forEach(issue => {
        if (issue.location && issue.location.lat && issue.location.lng) {
          const markerColor = issue.status === 'resolved' ? 'green' : issue.status === 'in_progress' ? 'orange' : 'red';

          // Simple custom icon styling using Leaflet DivIcon
          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:${markerColor}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          const marker = L.marker([issue.location.lat, issue.location.lng], { icon: customIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="font-family:sans-serif; min-width:200px;">
                <strong style="display:block; margin-bottom:4px;">${issue.title}</strong>
                <div style="font-size:12px; color:#666;">${issue.category}</div>
                <div style="font-size:12px; font-weight:bold; margin-top:4px; text-transform:uppercase;">
                  Status: ${issue.status.replace('_', ' ')}
                </div>
              </div>
            `);
          markersRef.current.push(marker);
        }
      });
    }
  }, [activeTab, issues]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/');

      const response = await fetch(`${baseUrl}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Kick out non-officers
        if (data.role !== 'officer') {
          handleLogout();
        } else {
          setUser(data);
        }
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Failed to fetch officer profile:", error);
    }
  };

  const fetchAllReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/api/issues/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/api/issues/${issueId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchAllReports(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Network error while updating status.");
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm("Are you sure you want to permanently delete this report?")) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/api/issues/${issueId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAllReports(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to delete issue:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex">

      {/* Dark Sidebar Navigation for Officers */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 p-6 flex flex-col justify-between shrink-0 shadow-xl z-20">
        <div>
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-700">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold border border-slate-600">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zm-2 11h-2v6h2v-6zm6 0h-2v6h2v-6zm-10 0H4v6h2v-6zm14 0h-2v6h2v-6z" />
              </svg>
            </div>
            <div>
              <div className="font-black text-white tracking-widest uppercase text-sm">CivicPulse</div>
              <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Command Center</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3">Central Dispatch</div>

            <button
              onClick={() => setActiveTab('command-center')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'command-center' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              📊 Operations Board
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              🗺️ Tactical Map
            </button>
          </div>
        </div>

        <div>
          <div className="mb-4 px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Officer</div>
            <div className="text-sm font-bold text-white truncate">{user?.name || 'Loading...'}</div>
            <div className="text-xs text-slate-400 truncate">{user?.email || ''}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/30 hover:border-rose-500"
          >
            LOCK TERMINAL
          </button>
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">

        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
            {activeTab === 'command-center' && 'Global Operations Board'}
            {activeTab === 'map' && 'Tactical Dispatch Map'}
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Authorized access level: Municipal Administrator</p>
        </header>

        {/* TAB 1: COMMAND CENTER (TABLE VIEW) */}
        {activeTab === 'command-center' && (
          <div className="space-y-6">

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-600">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Reports</div>
                <div className="text-3xl font-black text-slate-900">{issues.length}</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Open / Unassigned</div>
                <div className="text-3xl font-black text-rose-600">{issues.filter(i => i.status === 'open').length}</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">In Progress</div>
                <div className="text-3xl font-black text-amber-600">{issues.filter(i => i.status === 'in_progress').length}</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resolved</div>
                <div className="text-3xl font-black text-emerald-600">{issues.filter(i => i.status === 'resolved').length}</div>
              </div>
            </div>

            {/* Global Issues Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Incoming Dispatch Queue</h2>
                <button onClick={fetchAllReports} className="text-xs font-bold text-blue-600 hover:text-blue-800">↻ REFRESH DATA</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">AI Triage</th>
                      <th className="px-6 py-4">Report Details</th>
                      <th className="px-6 py-4">Location & Zone</th>
                      <th className="px-6 py-4">Status Control</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading central database...</td></tr>
                    ) : issues.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-semibold">No civic issues reported.</td></tr>
                    ) : (
                      issues.map((issue) => (
                        <tr key={issue._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded ${issue.severity === 'high' ? 'bg-rose-100 text-rose-700' :
                                issue.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-sky-100 text-sky-700'
                              }`}>
                              {issue.severity || 'Normal'}
                            </div>
                            {issue.ai_confidence > 0 && (
                              <div className="text-[10px] font-bold text-slate-400 mt-1">
                                CF: {(issue.ai_confidence * 100).toFixed(0)}%
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4 max-w-xs">
                            <div className="font-bold text-slate-900 truncate">{issue.title}</div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">{issue.category}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-1">{issue.description}</div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-700 text-xs">{issue.municipality}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]" title={issue.address}>
                              📍 {issue.address}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <select
                              value={issue.status}
                              onChange={(e) => handleUpdateStatus(issue._id, e.target.value)}
                              className={`text-xs font-bold uppercase tracking-wider rounded-lg px-3 py-1.5 border outline-none cursor-pointer transition-colors ${issue.status === 'open' ? 'bg-rose-50 border-rose-200 text-rose-700 focus:ring-rose-500' :
                                  issue.status === 'in_progress' ? 'bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500' :
                                    'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500'
                                }`}
                            >
                              <option value="open">OPEN</option>
                              <option value="in_progress">IN PROGRESS</option>
                              <option value="resolved">RESOLVED</option>
                            </select>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteIssue(issue._id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-2"
                              title="Delete Report"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TACTICAL MAP */}
        {activeTab === 'map' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-[750px]">
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Global Asset & Incident Tracking</div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase"><div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div> Open</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase"><div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-sm"></div> In Progress</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase"><div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm"></div> Resolved</div>
              </div>
            </div>

            <div ref={mapRef} className="w-full flex-1 rounded-xl border border-slate-200 z-10" />
          </div>
        )}

      </main>
    </div>
  );
}