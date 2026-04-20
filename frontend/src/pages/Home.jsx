import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Star, Shield, Clock } from 'lucide-react';
import RoomFilterBar from '../components/rooms/RoomFilterBar.jsx';
import Card from '../components/ui/Card.jsx';
import { RoomTypeIcon } from '../components/rooms/RoomCard.jsx';

const Home = () => {
  const navigate = useNavigate();

  const handleSearch = (filters) => {
    const params = new URLSearchParams({
      check_in: filters.checkIn,
      check_out: filters.checkOut,
      guests: filters.guests
    });
    navigate(`/rooms?${params.toString()}`);
  };

  const roomTypes = [
    { type: 'Standard', price: 'From $99', description: 'Comfortable and affordable', icon: 'blue' },
    { type: 'Deluxe', price: 'From $149', description: 'Enhanced amenities', icon: 'purple' },
    { type: 'Suite', price: 'From $249', description: 'Spacious luxury', icon: 'amber' },
    { type: 'Penthouse', price: 'From $499', description: 'Ultimate luxury', icon: 'rose' }
  ];

  const features = [
    { icon: Star, title: 'Top Rated', description: '4.9/5 average guest rating' },
    { icon: Shield, title: 'Secure Booking', description: 'Safe and encrypted payments' },
    { icon: Clock, title: '24/7 Support', description: 'Always here to help' },
    { icon: Bed, title: 'Premium Comfort', description: 'Luxury amenities in every room' }
  ];

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#FF385C] to-[#D9324E] py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Find your perfect stay
          </h1>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Discover luxury rooms at affordable prices. Book your next trip with StayHere.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <RoomFilterBar onSearch={handleSearch} />
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Room Types Section */}
      <div className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#222222] text-center mb-4">
            Choose your room type
          </h2>
          <p className="text-[#717171] text-center mb-12 max-w-2xl mx-auto">
            From cozy standards to luxurious penthouses, we have the perfect room for every traveler
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roomTypes.map((room) => (
              <Card 
                key={room.type} 
                className="p-6 text-center hover:shadow-xl transition-shadow cursor-pointer"
                hover
                onClick={() => navigate('/rooms')}
              >
                <div className="flex justify-center mb-4">
                  <RoomTypeIcon type={room.type} size="lg" />
                </div>
                <h3 className="text-xl font-semibold text-[#222222] mb-2">{room.type}</h3>
                <p className="text-[#717171] text-sm mb-3">{room.description}</p>
                <p className="text-[#FF385C] font-semibold">{room.price}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#222222] text-center mb-12">
            Why choose StayHere?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-[#FF385C]" />
                </div>
                <h3 className="text-lg font-semibold text-[#222222] mb-2">{feature.title}</h3>
                <p className="text-[#717171] text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-[#222222]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to book your stay?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of satisfied guests who choose StayHere for their travels.
          </p>
          <button 
            onClick={() => navigate('/rooms')}
            className="bg-[#FF385C] hover:bg-[#D9324E] text-white font-semibold px-8 py-4 rounded-lg transition-colors"
          >
            Explore Rooms
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
