import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, User, Lock, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(username, password, displayName);
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-cream flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-charcoal items-center justify-center p-12 relative overflow-hidden">
        {/* Bauhaus geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-red rounded-full opacity-90" />
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-cream rounded-full opacity-20" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-red opacity-60" style={{ transform: 'rotate(45deg)' }} />
        <div className="absolute bottom-20 left-32 w-16 h-32 bg-cream opacity-30" />

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-4 h-4 bg-red rounded-full" />
            <div className="w-4 h-4 bg-cream rounded-full" />
            <div className="w-4 h-4 bg-red rounded-full" />
          </div>
          <h1 className="text-6xl font-bold text-cream mb-4 tracking-tight">ChatX</h1>
          <p className="text-cream/60 text-lg max-w-sm">
            Secure messaging for your inner circle
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red rounded-full" />
              <div className="w-3 h-3 bg-charcoal rounded-full" />
              <div className="w-3 h-3 bg-red rounded-full" />
            </div>
            <h1 className="text-4xl font-bold text-charcoal tracking-tight">ChatX</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-charcoal mb-2">
              {isRegister ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="text-gray">
              {isRegister
                ? 'Join the conversation'
                : 'Sign in to continue chatting'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How should we call you?"
                    className="w-full pl-12 pr-4 py-3.5 bg-cream-dark border border-border rounded-xl
                             text-charcoal placeholder:text-gray-light
                             focus:outline-none focus:border-red focus:ring-1 focus:ring-red
                             transition-colors"
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Username
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-12 pr-4 py-3.5 bg-cream-dark border border-border rounded-xl
                           text-charcoal placeholder:text-gray-light
                           focus:outline-none focus:border-red focus:ring-1 focus:ring-red
                           transition-colors"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3.5 bg-cream-dark border border-border rounded-xl
                           text-charcoal placeholder:text-gray-light
                           focus:outline-none focus:border-red focus:ring-1 focus:ring-red
                           transition-colors"
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red/10 border border-red/20 rounded-xl text-red text-sm animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-charcoal text-cream py-3.5 rounded-xl font-medium
                       flex items-center justify-center gap-2
                       hover:bg-charcoal-light transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create account' : 'Sign in'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-gray hover:text-charcoal transition-colors"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
