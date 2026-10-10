import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import

export default function CitizenLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Initialize hook

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Logging in citizen:", email);
    navigate('/dashboard'); // Route to the dashboard
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-5xl">
          🏛️
        </div>
        <h2 className="mt-4 text-center text-3xl font-bold text-slate-900 tracking-tight">
          CivicPulse Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          Official Citizen Reporting System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md border-t-4 border-blue-900 sm:rounded-sm sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm rounded-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm rounded-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 rounded-sm transition-colors"
              >
                Secure Login
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Need an account?{' '}
              <a href="#" className="font-bold text-blue-900 hover:text-blue-700 underline">
                Register as a Citizen
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>An official website of the local municipal government.</p>
          <p className="mt-1">Unauthorized access is strictly prohibited.</p>
        </div>
      </div>
    </div>
  );
}