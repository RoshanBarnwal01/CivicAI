import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Live AI Triage Severity Evaluator
function evaluateIssueSeverity(issue) {
  const text = `${issue?.title || ''} ${issue?.description || ''}`.toLowerCase().trim();

  const highKeywords = [
    'high', 'huge', 'urgent', 'emergency', 'critical', 'severe', 'severity',
    'danger', 'dangerous', 'massive', 'burst', 'accident', 'crash',
    'injury', 'injured', 'deep', 'fire', 'smoke', 'spark', 'shock',
    'electrocut', 'live wire', 'exposed wire', 'short circuit',
    'collapse', 'collapsed', 'sinkhole', 'flood', 'flooding',
    'waterlogging', 'submerged', 'sewage', 'contaminated', 'toxic',
    'blocking', 'blocked', 'unpassable', 'hospital', 'school',
    'ambulance', 'hazard', 'hazardous', 'major', 'worst', 'deadly',
    'fatal', 'open manhole', 'uncovered manhole', 'fallen tree',
    'fallen pole', 'gas leak', 'explosion', 'big problem', 'huge problem'
  ];

  const lowKeywords = [
    'low', 'minor', 'small', 'slight', 'little', 'cosmetic',
    'faded', 'not urgent', 'slow', 'dust', 'peeling', 'tiny'
  ];

  const mediumKeywords = [
    'medium', 'moderate', 'leak', 'leaking', 'broken', 'outage',
    'overflow', 'overflowing', 'pothole', 'crater', 'damaged',
    'damage', 'garbage', 'trash', 'rubbish', 'waste', 'dump',
    'filth', 'stink', 'smell', 'odor', 'dark', 'street light',
    'streetlight', 'lamp', 'flickering', 'not working', 'drain',
    'drainage', 'clogged', 'choked', 'stagnant', 'mosquito',
    'pipe', 'no water', 'water supply', 'low pressure', 'repair',
    'crack', 'bad condition', 'unsafe', 'dirty', 'issue', 'problem'
  ];

  if (highKeywords.some((kw) => text.includes(kw))) return 'high';
  if (lowKeywords.some((kw) => text.includes(kw))) return 'low';
  if (mediumKeywords.some((kw) => text.includes(kw))) return 'medium';

  // Short test inputs without hazard keywords (e.g., "eeee", "www") triage as low
  if (text.length < 12) return 'low';

  return issue?.severity && issue.severity !== 'medium' ? issue.severity : 'medium';
}

export default function OfficerDashboard() {
  const [user] = useState({ name: 'Chief Municipal Officer', email: 'gov', role: 'officer' });
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('command-center');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('officerTheme');
    return saved ? saved === 'dark' : true;
  });

  const mapRef = useRef(null);
  const navigate = useNavigate();

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5005';

  const getOfficerToken = () => {
    return localStorage.getItem('officerToken') || localStorage.getItem('token');
  };

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('officerTheme', nextMode ? 'dark' : 'light');
  };

  const fetchGlobalIssues = async () => {
    const token = getOfficerToken();
    if (!token) {
      navigate('/officer');
      return;
    }

    try {
      const issuesRes = await fetch(`${baseUrl}/api/issues/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        const triagedIssues = (Array.isArray(issuesData) ? issuesData : []).map((item) => ({
          ...item,
          severity: evaluateIssueSeverity(item)
        }));
        setIssues(triagedIssues);
      }
    } catch (err) {
      console.error("Failed to fetch global issues:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalIssues();
  }, []);

  // Initialize Tactical Map when 'map-view' tab is selected
  useEffect(() => {
    if (activeTab !== 'map-view') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      const container = document.getElementById('tactical-map');
      if (!container || mapRef.current) return;

      const map = L.map('tactical-map').setView([22.5726, 88.3639], 12);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      issues.forEach((issue) => {
        const coords = issue.location?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
          const [lng, lat] = coords;
          const color =
            issue.status === 'resolved'
              ? '#10b981'
              : issue.severity === 'high' || issue.severity === 'critical'
                ? '#ef4444'
                : issue.severity === 'medium'
                  ? '#f59e0b'
                  : '#3b82f6';

          const markerIcon = L.divIcon({
            className: 'tactical-marker',
            html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px ${color};"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          L.marker([lat, lng], { icon: markerIcon })
            .addTo(map)
            .bindPopup(
              `<strong>${issue.title}</strong><br/>Category: ${issue.category || 'N/A'}<br/>Severity: ${issue.severity.toUpperCase()}<br/>Status: ${issue.status}`
            );
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [activeTab, issues]);

  const updateStatus = async (id, newStatus) => {
    const token = getOfficerToken();
    try {
      const res = await fetch(`${baseUrl}/api/issues/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setIssues((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async (id) => {
    const token = getOfficerToken();
    try {
      const res = await fetch(`${baseUrl}/api/issues/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setIssues((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete issue:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('officerToken');
    navigate('/officer');
  };

  const totalCount = issues.length;
  const openCount = issues.filter((i) => i.status === 'open').length;
  const inProgressCount = issues.filter((i) => i.status === 'in_progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

  return (
    <div className={`min-h-screen flex font-sans transition-colors ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col justify-between shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div>
          <div className={`p-6 border-b flex items-center space-x-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
              CP
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">CivicPulse</h1>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Command Center</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('command-center')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'command-center'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Operations Board
            </button>
            <button
              onClick={() => setActiveTab('map-view')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'map-view'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Tactical Map
            </button>
          </nav>
        </div>

        <div className={`p-4 border-t space-y-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>

          <div className="px-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Active Officer</p>
            <p className="text-sm font-bold truncate">{user?.name || 'Chief Municipal Officer'}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            End Shift / Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Municipal Dispatch & Triage</h2>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Live feed of citizen-submitted civic reports across all municipal zones.
            </p>
          </div>
          <button
            onClick={fetchGlobalIssues}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            ↻ Sync Live Queue
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Incidents</p>
            <p className="text-3xl font-extrabold mt-1">{totalCount}</p>
          </div>
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className="text-xs font-bold text-rose-400 uppercase">Open / Unassigned</p>
            <p className="text-3xl font-extrabold text-rose-500 mt-1">{openCount}</p>
          </div>
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className="text-xs font-bold text-amber-400 uppercase">In Progress</p>
            <p className="text-3xl font-extrabold text-amber-500 mt-1">{inProgressCount}</p>
          </div>
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className="text-xs font-bold text-emerald-400 uppercase">Resolved</p>
            <p className="text-3xl font-extrabold text-emerald-500 mt-1">{resolvedCount}</p>
          </div>
        </div>

        {activeTab === 'command-center' ? (
          <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            {isLoading ? (
              <div className="p-12 text-center text-sm text-slate-400">Synchronizing live incident queue...</div>
            ) : issues.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">No active citizen complaints in the database.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      <th className="py-4 px-6">AI Triage</th>
                      <th className="py-4 px-6">Report Details</th>
                      <th className="py-4 px-6">Location & Zone</th>
                      <th className="py-4 px-6">Status Control</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-sm ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {issues.map((issue) => (
                      <tr key={issue._id} className={isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${issue.severity === 'high' || issue.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : issue.severity === 'medium'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                            {issue.severity || 'low'}
                          </span>
                          <div className="text-xs text-slate-400 mt-1 font-medium">{issue.category || 'General'}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold">{issue.title}</div>
                          <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{issue.description}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="text-xs font-bold text-blue-400">{issue.municipality || 'Kolkata Municipal Corporation'}</div>
                          <div className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{issue.address || 'Pinned Coordinates'}</div>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <select
                            value={issue.status || 'open'}
                            onChange={(e) => updateStatus(issue._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border focus:outline-none ${isDarkMode
                                ? 'bg-slate-800 border-slate-700 text-white'
                                : 'bg-slate-100 border-slate-300 text-slate-900'
                              }`}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(issue._id)}
                            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div id="tactical-map" className="w-full h-[540px] rounded-xl z-0"></div>
          </div>
        )}
      </main>
    </div>
  );
}