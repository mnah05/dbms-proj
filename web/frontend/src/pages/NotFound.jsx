import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-[#FF385C]">404</span>
        </div>
        <h1 className="text-3xl font-bold text-[#222222] mb-4">Page not found</h1>
        <p className="text-[#717171] mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Link to="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
