import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OfficerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5005';

  useEffect(() => {
    fetch(`${baseUrl}/api/health`).catch(() => { });
  }, [baseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (email.trim() !== 'gov' || password !== '1122') {
      setErrorMsg('ACCESS DENIED: Invalid Municipal Officer Credentials.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store Officer token separately so it never collides with Citizen sessions
        localStorage.setItem('officerToken', data.token);
        navigate('/officer-dashboard');
      } else {
        setErrorMsg(data.message || 'Unauthorized Officer credentials.');
      }
    } catch (err) {
      console.error("Officer login error:", err);
      setErrorMsg('SYSTEM OFFLINE: Unable to reach Command Server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">

        {/* Header Section */}
        <div className="bg-slate-950 py-8 px-6 text-center border-b border-slate-800">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="Civic AI"
              className="w-12 h-12 rounded-xl object-cover shadow-md"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Civic AI</h1>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Municipal Command Portal</p>
        </div>

        <div className="p-8">
          {/* Portal Toggle Switch */}
          <div className="flex bg-slate-900 rounded-lg p-1 mb-8 border border-slate-700">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2 text-sm font-semibold text-slate-400 rounded-md hover:text-white transition-colors"
            >
              Citizen
            </button>
            <button
              type="button"
              className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 rounded-md shadow-sm"
            >
              Officer
            </button>
          </div>

          <h2 className="text-xl font-bold text-center text-white mb-6">
            Administrator Dispatch Login
          </h2>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-950/60 border-l-4 border-rose-500 text-rose-300 text-xs font-semibold rounded-r-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Officer ID</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Officer ID (e.g., gov)"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Security Passcode</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying Credentials...' : 'Access Command Center'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}