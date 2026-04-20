import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, MapPin, SlidersHorizontal } from 'lucide-react';
import RoomCard from '../components/rooms/RoomCard.jsx';
import RoomFilterBar from '../components/rooms/RoomFilterBar.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getAvailableRooms } from '../api/client.js';

const Rooms = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Set default dates: today and tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({
    checkIn: searchParams.get('check_in') || formatDate(today),
    checkOut: searchParams.get('check_out') || formatDate(tomorrow),
    guests: parseInt(searchParams.get('guests')) || 2,
    roomType: searchParams.get('room_type') || ''
  });

  const roomTypes = ['All', 'Standard', 'Deluxe', 'Suite', 'Penthouse'];

  useEffect(() => {
    // Only fetch if we have dates
    if (filters.checkIn && filters.checkOut) {
      fetchRooms();
    }
  }, [filters.checkIn, filters.checkOut, filters.guests]);

  const fetchRooms = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        check_in: filters.checkIn,
        check_out: filters.checkOut
      };
      
      const response = await getAvailableRooms(params);
      let availableRooms = response.data || [];
      
      // Filter by guests capacity
      if (filters.guests) {
        availableRooms = availableRooms.filter(room => room.max_occupancy >= filters.guests);
      }
      
      // Filter by room type
      if (filters.roomType && filters.roomType !== 'All') {
        availableRooms = availableRooms.filter(room => room.room_type === filters.roomType);
      }
      
      setRooms(availableRooms);
    } catch (err) {
      setError('Failed to load rooms. Please try again.');
      console.error('Error fetching rooms:', err);
    }

    setLoading(false);
  };

  const handleSearch = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    const params = new URLSearchParams({
      check_in: newFilters.checkIn,
      check_out: newFilters.checkOut,
      guests: newFilters.guests
    });
    setSearchParams(params);
  };

  const handleRoomTypeChange = (type) => {
    setFilters(prev => ({ ...prev, roomType: type }));
  };

  const handleBook = (room) => {
    const params = new URLSearchParams({
      room_id: room.room_id,
      check_in: filters.checkIn,
      check_out: filters.checkOut,
      guests: filters.guests
    });
    navigate(`/rooms/${room.room_id}/book?${params.toString()}`);
  };

  return (
    <div className="flex-1 bg-white">
      {/* Search Bar Sticky */}
      <div className="sticky top-20 z-30 bg-white border-b border-[#DDDDDD] py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RoomFilterBar onSearch={handleSearch} initialFilters={{
            checkIn: filters.checkIn,
            checkOut: filters.checkOut,
            guests: filters.guests
          }} />
        </div>
      </div>

      {/* Room Type Filter */}
      <div className="border-b border-[#DDDDDD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <SlidersHorizontal className="w-5 h-5 text-[#717171] mr-2" />
            {roomTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleRoomTypeChange(type)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  filters.roomType === type || (type === 'All' && !filters.roomType)
                    ? 'bg-[#222222] text-white'
                    : 'bg-white border border-[#DDDDDD] text-[#222222] hover:border-[#222222]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#222222]">
            {loading ? 'Loading rooms...' : `${rooms.length} rooms available`}
          </h1>
          {filters.checkIn && filters.checkOut && (
            <p className="text-[#717171] mt-1">
              {new Date(filters.checkIn).toLocaleDateString()} - {new Date(filters.checkOut).toLocaleDateString()} · {filters.guests} guest{filters.guests > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRooms}>Try Again</Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && rooms.length === 0 && (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-[#DDDDDD] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#222222] mb-2">No rooms found</h3>
            <p className="text-[#717171] mb-6">
              No rooms available for these dates. Try selecting different dates.
            </p>
            <Button onClick={() => {
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const formatDate = (d) => d.toISOString().split('T')[0];
              handleSearch({ 
                checkIn: formatDate(today), 
                checkOut: formatDate(tomorrow), 
                guests: 2 
              });
            }}>
              Reset to Today
            </Button>
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && !error && rooms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <RoomCard 
                key={room.room_id} 
                room={room} 
                onBook={handleBook}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
