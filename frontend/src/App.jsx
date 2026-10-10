import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CitizenLogin from './CitizenLogin';
import OfficerLogin from './OfficerLogin';
import CitizenDashboard from './CitizenDashboard';
import OfficerDashboard from './OfficerDashboard'; // Import the new component

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CitizenLogin />} />
        <Route path="/officer" element={<OfficerLogin />} />
        <Route path="/dashboard" element={<CitizenDashboard />} />
        <Route path="/officer-dashboard" element={<OfficerDashboard />} /> {/* New Route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;