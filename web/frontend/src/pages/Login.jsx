import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

const Login = () => {
  const navigate = useNavigate();
  const { loginCustomer } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginCustomer(formData);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#FF385C] items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-[#FF385C]" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-xl opacity-90">Sign in to book your next stay</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-[#FF385C] rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#222222]">StayHere</h1>
          </div>

          <h2 className="text-3xl font-bold text-[#222222] mb-2">Log in</h2>
          <p className="text-[#717171] mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#FF385C] hover:underline font-medium">
              Sign up
            </Link>
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[#717171] hover:text-[#222222]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Log in'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/admin/login" className="text-sm text-[#717171] hover:text-[#222222]">
              Admin login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
