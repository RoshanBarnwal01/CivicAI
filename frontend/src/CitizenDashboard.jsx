import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks and drop pins
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

export default function CitizenDashboard() {
  // Defaulting to North Kolkata coordinates
  const [position, setPosition] = useState({ lat: 22.5958, lng: 88.3721 });
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const reportData = { title, category, description, location: position };
    console.log("Submitting to AI microservice for prioritization:", reportData);
    alert("Report submitted successfully!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Navigation */}
      <nav className="bg-blue-900 text-white px-6 py-4 shadow-md flex justify-between items-center">
        <div className="text-xl font-bold flex items-center gap-2">
          🏛️ CivicPulse Dashboard
        </div>
        <div className="text-sm font-medium">
          Logged in as Citizen | <a href="/" className="underline hover:text-blue-200">Logout</a>
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Column: Reporting Form */}
        <div className="w-full md:w-1/3 bg-white p-6 shadow-lg z-10 overflow-y-auto border-r border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Report an Issue</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Issue Title</label>
              <input
                type="text" required
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                placeholder="e.g., Broken Streetlight"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Category</label>
              <select
                required value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
              >
                <option value="" disabled>Select category...</option>
                <option value="Road Hazard">Road Hazard</option>
                <option value="Sanitation & Waste">Sanitation & Waste</option>
                <option value="Pest & Insect Infestation">Pest & Insect Infestation</option>
                <option value="Water & Plumbing">Water Supply</option>
                <option value="Electrical">Streetlights & Electrical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Description</label>
              <textarea
                required rows="4"
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                placeholder="Provide details for the responding officer..."
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-sm text-slate-600">
              <span className="font-bold text-slate-900">Selected Location:</span><br/>
              Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
              <p className="mt-1 text-xs italic">Click anywhere on the map to update the pin.</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-900 text-white font-bold rounded-sm hover:bg-blue-800 transition-colors shadow-sm"
            >
              Submit Report
            </button>
          </form>
        </div>

        {/* Right Column: Interactive Map */}
        <div className="w-full md:w-2/3 h-[500px] md:h-auto relative z-0">
          <MapContainer center={[22.5958, 88.3721]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}