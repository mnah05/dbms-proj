import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Gift, Calendar } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getProfile } from '../api/client.js';
import { formatDate } from '../utils/formatDate.js';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const displayData = profile || user;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-[#222222] mb-8">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Quick Stats */}
        <div className="md:col-span-1">
          <Card className="p-6 text-center">
            <div className="w-24 h-24 bg-[#222222] rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#222222]">
              {displayData?.first_name} {displayData?.last_name}
            </h2>
            <p className="text-[#717171] text-sm mb-4">Member since {formatDate(displayData?.created_at)}</p>
            
            {/* Loyalty Points */}
            <div className="bg-[#FF385C]/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="w-5 h-5 text-[#FF385C]" />
                <span className="font-semibold text-[#FF385C]">{displayData?.loyalty_points || 0} Points</span>
              </div>
              <p className="text-xs text-[#717171]">Earn more with every booking</p>
            </div>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#222222]">Personal Information</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            {editing ? (
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    defaultValue={displayData?.first_name}
                  />
                  <Input
                    label="Last Name"
                    defaultValue={displayData?.last_name}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  defaultValue={displayData?.email}
                />
                <Input
                  label="Phone"
                  defaultValue={displayData?.phone}
                />
                <Input
                  label="Address"
                  defaultValue={displayData?.address}
                />
                <Button fullWidth>Save Changes</Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 py-3 border-b border-[#DDDDDD]">
                  <Mail className="w-5 h-5 text-[#717171]" />
                  <div>
                    <p className="text-sm text-[#717171]">Email</p>
                    <p className="text-[#222222]">{displayData?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 border-b border-[#DDDDDD]">
                  <Phone className="w-5 h-5 text-[#717171]" />
                  <div>
                    <p className="text-sm text-[#717171]">Phone</p>
                    <p className="text-[#222222]">{displayData?.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 border-b border-[#DDDDDD]">
                  <MapPin className="w-5 h-5 text-[#717171]" />
                  <div>
                    <p className="text-sm text-[#717171]">Address</p>
                    <p className="text-[#222222]">{displayData?.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <Calendar className="w-5 h-5 text-[#717171]" />
                  <div>
                    <p className="text-sm text-[#717171]">Member Since</p>
                    <p className="text-[#222222]">{formatDate(displayData?.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Security Card */}
          <Card className="p-6 mt-6">
            <h3 className="text-xl font-semibold text-[#222222] mb-4">Security</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[#222222] font-medium">Password</p>
                  <p className="text-sm text-[#717171]">Last changed recently</p>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
