import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function CitizenDashboard() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Report Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Roads & Infrastructure');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [municipality, setMunicipality] = useState('Kolkata Municipal Corporation');
  const [coords, setCoords] = useState({ lat: 22.5726, lng: 88.3639 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const navigate = useNavigate();

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5005';

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const [userRes, reportsRes] = await Promise.all([
        fetch(`${baseUrl}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/issues/my-reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (userRes.status === 401 || userRes.status === 403) {
        localStorage.clear();
        navigate('/');
        return;
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.role === 'officer') {
          navigate('/officer-dashboard');
          return;
        }
        setUser(userData);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(Array.isArray(reportsData) ? reportsData : []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-detect address and municipality via Nominatim Reverse Geocoding
  const reverseGeocode = async (lat, lng) => {
    setIsLocating(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        const addrText = data.display_name.toLowerCase();
        if (addrText.includes('panihati')) setMunicipality('Panihati Municipality');
        else if (addrText.includes('baranagar')) setMunicipality('Baranagar Municipality');
        else if (addrText.includes('kamarhati')) setMunicipality('Kamarhati Municipality');
        else if (addrText.includes('bidhannagar') || addrText.includes('salt lake')) setMunicipality('Bidhannagar Municipal Corporation');
        else if (addrText.includes('howrah')) setMunicipality('Howrah Municipal Corporation');
        else setMunicipality('Kolkata Municipal Corporation');
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    } finally {
      setIsLocating(false);
    }
  };

  // Initialize Leaflet Map when switching to 'report' tab
  useEffect(() => {
    if (activeTab !== 'report') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      const container = document.getElementById('citizen-map');
      if (!container || mapRef.current) return;

      const map = L.map('citizen-map').setView([coords.lat, coords.lng], 14);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const marker = L.marker([coords.lat, coords.lng], { draggable: true, icon: customIcon }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
      },
      () => setIsLocating(false)
    );
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${baseUrl}/api/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          category,
          description,
          address: address || `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`,
          municipality,
          location: {
            lat: coords.lat,
            lng: coords.lng,
            type: 'Point',
            coordinates: [coords.lng, coords.lat]
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage({ type: 'success', text: 'Complaint registered successfully and dispatched to Municipal Command!' });
        setTitle('');
        setDescription('');
        await fetchDashboardData();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to submit complaint.' });
      }
    } catch (err) {
      console.error("Report submit error:", err);
      setStatusMessage({ type: 'error', text: 'Network error while submitting report.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;
  const pendingReports = reports.filter(r => r.status !== 'resolved').length;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              CP
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">CivicPulse</h1>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Citizen Portal</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'report' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Map & Report Issue
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Profile Settings
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="mb-3 px-2">
            <p className="text-xs font-bold text-slate-400 uppercase">Signed in as</p>
            <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'Citizen'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'overview' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name || 'Citizen'}</h2>
                <p className="text-sm text-slate-500">Track your submitted municipal complaints and real-time resolution progress.</p>
              </div>
              <button
                onClick={() => setActiveTab('report')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-sm transition-colors"
              >
                + Report New Issue
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submitted</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalReports}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Active / In Progress</p>
                <p className="text-3xl font-extrabold text-amber-600 mt-2">{pendingReports}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Resolved</p>
                <p className="text-3xl font-extrabold text-emerald-600 mt-2">{resolvedReports}</p>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">My Reported Issues</h3>
                <button onClick={fetchDashboardData} className="text-xs font-bold text-blue-600 hover:underline">
                  Refresh List
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-sm text-slate-500">Loading your reports...</div>
              ) : reports.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-500 text-sm mb-4">You haven't reported any civic issues yet.</p>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg"
                  >
                    Submit Your First Report
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reports.map((item) => (
                    <div key={item._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {item.category || 'General'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">{item.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                        <p className="text-xs text-slate-400 mt-1">📍 {item.address || item.municipality || 'Pinned Location'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                          {item.status ? item.status.replace('_', ' ') : 'open'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Report a Civic Issue</h2>
            <p className="text-sm text-slate-500 mb-6">Click on the interactive map or drag the pin to auto-detect the municipality and address.</p>

            {statusMessage.text && (
              <div className={`mb-6 p-4 rounded-xl border-l-4 text-sm font-semibold ${statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-rose-50 border-rose-500 text-rose-800'
                }`}>
                {statusMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Map Column */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">Incident Location Pin</span>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {isLocating ? 'Detecting GPS...' : '📍 Use My GPS'}
                  </button>
                </div>
                <div id="citizen-map" className="w-full h-96 rounded-xl border border-slate-200 z-0"></div>
                <p className="text-xs text-slate-400 mt-2">
                  Coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              </div>

              {/* Form Column */}
              <form onSubmit={handleReportSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Issue Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Deep pothole blocking main road"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Sanitation & Waste">Sanitation & Waste</option>
                    <option value="Water Supply & Drainage">Water Supply & Drainage</option>
                    <option value="Street Lighting & Electrical">Street Lighting & Electrical</option>
                    <option value="Public Safety & Hazards">Public Safety & Hazards</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detected Municipality / Zone</label>
                  <input
                    type="text"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Street Address / Landmark</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Click on the map or enter landmark"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detailed Description</label>
                  <textarea
                    rows="3"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the severity and exact hazard..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? 'Dispatching Report...' : 'Submit Official Complaint'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Citizen Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <p className="text-base font-bold text-slate-800 mt-1">{user?.name || 'Citizen User'}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase">Registered Email</label>
                <p className="text-base font-bold text-slate-800 mt-1">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase">Account Role</label>
                <p className="text-sm font-bold text-blue-600 uppercase mt-1">{user?.role || 'citizen'}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}