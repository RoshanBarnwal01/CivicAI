import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CitizenLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5005';

  // Pre-wake Render server on page load
  useEffect(() => {
    fetch(`${baseUrl}/api/health`).catch(() => { });
  }, [baseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password, role: 'citizen' };

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store Citizen token & profile separately from Officer session
        localStorage.setItem('citizenToken', data.token);
        localStorage.setItem('token', data.token);
        const citizenProfile = data.user || {
          name: name || email.split('@')[0],
          email,
          role: 'citizen'
        };
        localStorage.setItem('citizenUser', JSON.stringify(citizenProfile));
        navigate('/dashboard');
      } else {
        setErrorMsg(data.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error("Login network error:", err);
      setErrorMsg('SYSTEM OFFLINE: Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">

        {/* Header Section */}
        <div className="bg-blue-600 py-8 px-6 text-center">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="Civic AI"
              className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Civic AI</h1>
          <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">Citizen Portal</p>
        </div>

        <div className="p-8">
          {/* Portal Toggle Switch */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-8 border border-slate-200">
            <button
              type="button"
              className="flex-1 py-2 text-sm font-bold text-blue-700 bg-white rounded-md shadow-sm"
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => navigate('/officer')}
              className="flex-1 py-2 text-sm font-semibold text-slate-500 rounded-md hover:bg-slate-200 transition-colors"
            >
              Officer
            </button>
          </div>

          <h2 className="text-xl font-bold text-center text-slate-800 mb-6">
            {isLogin ? 'Sign In to Your Account' : 'Create a Citizen Account'}
          </h2>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs font-semibold rounded-r-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-4 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center text-sm font-medium text-slate-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              className="text-blue-600 font-bold hover:underline focus:outline-none"
            >
              {isLogin ? 'Register here' : 'Sign in here'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}