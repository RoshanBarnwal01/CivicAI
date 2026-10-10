import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CitizenLogin() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Matches the exact routes from your teammate's backend code
    const endpoint = isRegistering ? '/api/auth/citizen/signup' : '/api/auth/citizen/login';

    // 2. Includes the 'name' field only if the user is registering
    const payload = isRegistering ? { name, email, password } : { email, password };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (isRegistering) {
          alert("Account created successfully! You can now log in.");
          setIsRegistering(false);
          setPassword(''); // Clear password for security
        } else {
          navigate('/dashboard');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || `${isRegistering ? 'Registration' : 'Login'} failed.`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect to the backend server.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-5xl">
          🏛️
        </div>
        <h2 className="mt-4 text-center text-3xl font-bold text-slate-900 tracking-tight">
          Citizen Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isRegistering ? "Create your account to report issues." : "Sign in to your account."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border-t-4 border-blue-900 sm:rounded-sm sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* The Name field only appears when registering */}
            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-900">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    type="text"
                    required={isRegistering}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    placeholder="Rishav Ghosh"
                  />
                </div>
              </div>
            )}

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
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  placeholder="citizen@example.com"
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
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 rounded-sm transition-colors"
              >
                {isRegistering ? 'Register Account' : 'Secure Login'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-medium text-blue-900 hover:text-blue-700 focus:outline-none"
            >
              {isRegistering
                ? "Already have an account? Log in here."
                : "Don't have an account? Register here."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}