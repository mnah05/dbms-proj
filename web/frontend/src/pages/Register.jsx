import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Eye, EyeOff } from 'lucide-react';
import { register as registerApi } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { loginCustomer } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { confirm_password, ...registerData } = formData;
      await registerApi(registerData);
      
      // Auto-login after registration
      const loginResult = await loginCustomer({
        email: formData.email,
        password: formData.password
      });

      if (loginResult.success) {
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
          <h1 className="text-4xl font-bold mb-4">Join StayHere</h1>
          <p className="text-xl opacity-90">Create an account to start booking</p>
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

          <h2 className="text-3xl font-bold text-[#222222] mb-2">Sign up</h2>
          <p className="text-[#717171] mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FF385C] hover:underline font-medium">
              Log in
            </Link>
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="John"
              />
              <Input
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="Doe"
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />

            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+1 (555) 123-4567"
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[#717171] hover:text-[#222222]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Input
              label="Confirm Password"
              name="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>

          <p className="mt-6 text-xs text-[#717171] text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
