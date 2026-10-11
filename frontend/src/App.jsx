import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CitizenLogin from './CitizenLogin';
import OfficerLogin from './OfficerLogin';
import CitizenDashboard from './CitizenDashboard';
import OfficerDashboard from './OfficerDashboard';

// Note: If you have a separate Register.jsx file, import it here and add its Route below.

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Routes */}
        <Route path="/" element={<CitizenLogin />} />
        <Route path="/officer" element={<OfficerLogin />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<CitizenDashboard />} />
        <Route path="/officer-dashboard" element={<OfficerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;