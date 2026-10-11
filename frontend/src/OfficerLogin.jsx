import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OfficerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // CLOUD-READY VARIABLE
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5005';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/officer-dashboard');
      } else {
        setErrorMsg(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      console.error("Login network error:", err);
      setErrorMsg('SYSTEM OFFLINE: COULD NOT CONNECT TO THE CENTRAL SERVER.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a101f] font-sans p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700">

        <div className="bg-[#0f172a] py-8 px-6 text-center border-b-4 border-blue-600">
          <div className="flex justify-center mb-3">
            <svg className="w-10 h-10 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zm-2 11h-2v6h2v-6zm6 0h-2v6h2v-6zm-10 0H4v6h2v-6zm14 0h-2v6h2v-6z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-1">CivicPulse</h1>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>

        <div className="p-8">
          <div className="flex bg-slate-50 rounded-lg p-1 mb-8 border border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2 text-sm font-semibold text-slate-500 rounded-md hover:bg-slate-200 transition-colors"
            >
              Citizen
            </button>
            <button
              type="button"
              className="flex-1 py-2 text-sm font-bold text-white bg-[#0f172a] rounded-md shadow-sm"
            >
              Officer
            </button>
          </div>

          <h2 className="text-xl font-bold text-center text-slate-800 mb-6">Municipal Dispatch Login</h2>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-[11px] font-bold uppercase tracking-wide">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Officer ID</label>
              <input
                type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="gov"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Security Passcode</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full py-4 mt-2 bg-[#0f172a] hover:bg-slate-800 text-white font-black tracking-widest uppercase rounded-lg text-sm transition-colors shadow-lg"
            >
              {isLoading ? 'Authenticating...' : 'Access Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}