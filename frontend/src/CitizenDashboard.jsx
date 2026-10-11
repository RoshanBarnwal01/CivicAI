import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function CitizenDashboard() {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Road Hazard / Pothole');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Kolkata, West Bengal');
  const [municipality, setMunicipality] = useState('Kolkata Municipal Corporation');
  const [coords, setCoords] = useState({ lat: 22.5726, lng: 88.3639 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const navigate = useNavigate();

  // CLOUD-READY VARIABLE
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5005';

  useEffect(() => {
    fetchUserData();
    fetchCitizenReports();
  }, []);

  useEffect(() => {
    if (activeTab === 'map' && mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([coords.lat, coords.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', function (e) {
        const position = marker.getLatLng();
        updateLocationData(position.lat, position.lng);
      });

      map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        updateLocationData(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
    }
  }, [activeTab]);

  const updateLocationData = async (lat, lng) => {
    setCoords({ lat, lng });
    setIsLocating(true);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();

      if (data && data.display_name) {
        const fullAddress = data.display_name;
        setAddress(fullAddress);

        const textLower = fullAddress.toLowerCase();
        if (textLower.includes('panihati')) setMunicipality('Panihati Municipality');
        else if (textLower.includes('baranagar')) setMunicipality('Baranagar Municipality');
        else if (textLower.includes('kamarhati')) setMunicipality('Kamarhati Municipality');
        else if (textLower.includes('dum dum')) setMunicipality('South Dum Dum Municipality');
        else if (textLower.includes('bidhannagar') || textLower.includes('salt lake')) setMunicipality('Bidhannagar Municipal Corporation');
        else if (textLower.includes('howrah')) setMunicipality('Howrah Municipal Corporation');
        else if (textLower.includes('barrackpore')) setMunicipality('Barrackpore Municipality');
        else setMunicipality('Kolkata Municipal Corporation');
      }
    } catch (err) {
      console.error("Geocoding lookup failed:", err);
    } finally {
      setIsLocating(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/');

      const response = await fetch(`${baseUrl}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        localStorage.clear();
        navigate('/');
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const fetchCitizenReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${baseUrl}/api/issues/my-reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        title,
        category,
        description,
        address,
        municipality,
        location: { lat: coords.lat, lng: coords.lng }
      };

      const response = await fetch(`${baseUrl}/api/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok) {
        setTitle('');
        setDescription('');
        fetchCitizenReports();
        setActiveTab('dashboard');
        alert("Report submitted and routed through AI successfully!");
      } else {
        alert(`Failed to submit issue: ${resData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error submitting issue:", err);
      alert("Network error while submitting report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">CP</div>
            <span className="font-semibold text-base tracking-tight text-slate-900">CivicPulse</span>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Overview</div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'map' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              📍 Map & Report
            </button>
            <div className="pt-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Configuration</div>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              ⚙️ Profile Settings
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {activeTab === 'dashboard' && 'Citizen Dashboard'}
              {activeTab === 'map' && 'Interactive Map & Issue Reporting'}
              {activeTab === 'settings' && 'Account Settings'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Welcome back, {user?.name || 'Citizen'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100 text-sm shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Reports</div>
                <div className="text-3xl font-bold text-slate-900">{issues.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active / Open</div>
                <div className="text-3xl font-bold text-amber-600">{issues.filter(i => i.status !== 'resolved').length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resolved</div>
                <div className="text-3xl font-bold text-emerald-600">{issues.filter(i => i.status === 'resolved').length}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Your Reported Incidents</h2>
                <button
                  onClick={() => setActiveTab('map')}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  + Drop Pin & Report New Issue
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-3">Severity</div>
                  <div className="col-span-5">Issue Details</div>
                  <div className="col-span-4 text-right">Status</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {issues.length === 0 ? (
                    <div className="p-12 text-center text-sm text-slate-400 font-medium">You haven't submitted any civic reports yet. Click 'Map & Report' to start!</div>
                  ) : (
                    issues.map((issue) => (
                      <div key={issue._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                        <div className="col-span-3">
                          <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded ${issue.severity === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              issue.severity === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                'bg-sky-50 text-sky-600 border border-sky-100'
                            }`}>
                            {issue.severity || 'Normal'}
                          </span>
                        </div>
                        <div className="col-span-5">
                          <div className="font-semibold text-slate-900 text-sm">{issue.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{issue.category} - 📍 {issue.address}</div>
                        </div>
                        <div className="col-span-4 text-right">
                          <span className={`inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg border ${issue.status === 'open' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              issue.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                            {issue.status ? issue.status.replace('_', ' ') : 'open'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Report Issue via Map Pin</h2>
              <p className="text-xs text-slate-500 mb-6">Drag pin or click map to auto-detect location and municipality.</p>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Issue Title</label>
                  <input
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Broken Streetlight"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category (AI Analyzed)</label>
                  <select
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Road Hazard / Pothole">Road Hazard / Pothole</option>
                    <option value="Water Leak / Pipe Burst">Water Leak / Pipe Burst</option>
                    <option value="Streetlight Outage">Streetlight Outage</option>
                    <option value="Garbage / Illegal Dumping">Garbage / Illegal Dumping</option>
                    <option value="General Infrastructure">General Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Auto-Detected Municipality Router {isLocating && <span className="text-blue-500 font-normal animate-pulse">(Detecting...)</span>}
                  </label>
                  <select
                    value={municipality} onChange={(e) => setMunicipality(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Kolkata Municipal Corporation">Kolkata Municipal Corporation</option>
                    <option value="Panihati Municipality">Panihati Municipality</option>
                    <option value="Baranagar Municipality">Baranagar Municipality</option>
                    <option value="Kamarhati Municipality">Kamarhati Municipality</option>
                    <option value="South Dum Dum Municipality">South Dum Dum Municipality</option>
                    <option value="Bidhannagar Municipal Corporation">Bidhannagar Municipal Corporation</option>
                    <option value="Howrah Municipal Corporation">Howrah Municipal Corporation</option>
                    <option value="Barrackpore Municipality">Barrackpore Municipality</option>
                    <option value="Serampore Municipality">Serampore Municipality</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detected Address</label>
                  <input
                    type="text" readOnly value={address}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 truncate"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows="3" required value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the issue..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Routing via AI...' : 'Submit Pinned Report'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Interactive Dispatch Map (Click or Drag Pin)</div>
              <div ref={mapRef} className="w-full h-[520px] rounded-xl border border-slate-200 z-10" />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-xl shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Profile Settings</h2>
            <p className="text-xs text-slate-500 mb-6">Manage your citizen account details.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800">
                  {user?.name || 'Loading...'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800">
                  {user?.email || 'Loading...'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Role</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-blue-600 uppercase">
                  {user?.role || 'Citizen'}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}