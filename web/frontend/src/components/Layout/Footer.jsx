import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Globe } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#F7F7F7] border-t border-[#DDDDDD] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#FF385C] rounded-full flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#FF385C] text-xl font-bold">StayHere</span>
            </Link>
            <p className="text-sm text-[#717171]">
              Find the perfect place to stay for your next trip. Luxury rooms at affordable prices.
            </p>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-[#222222] mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-[#717171] hover:text-[#222222]">Help Center</a></li>
              <li><a href="#" className="text-[#717171] hover:text-[#222222]">Safety Information</a></li>
              <li><a href="#" className="text-[#717171] hover:text-[#222222]">Cancellation Options</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-[#222222] mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-[#717171] hover:text-[#222222]">About Us</a></li>
              <li><a href="#" className="text-[#717171] hover:text-[#222222]">Careers</a></li>
              <li><a href="#" className="text-[#717171] hover:text-[#222222]">Blog</a></li>
            </ul>
          </div>

          {/* Terms */}
          <div>
            <h4 className="font-semibold text-[#222222] mb-4">Terms</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-[#717171] hover:text-[#222222]">Privacy Policy</a></li>
              <li><a href="#" className="text-[#717171] hover:text-[#222222]">Terms of Service</a></li>
              <li><Link to="/admin/login" className="text-[#717171] hover:text-[#222222]">Admin Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#DDDDDD] pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#717171]">
            © {currentYear} StayHere, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-[#222222]">
            <button className="flex items-center gap-1 hover:underline">
              <Globe className="w-4 h-4" />
              English (US)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
