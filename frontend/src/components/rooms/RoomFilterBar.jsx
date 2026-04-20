import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { Search, Users, Calendar } from 'lucide-react';
import Button from '../ui/Button.jsx';
import 'react-datepicker/dist/react-datepicker.css';

const RoomFilterBar = ({ onSearch, initialFilters = {} }) => {
  const [checkIn, setCheckIn] = useState(initialFilters.checkIn ? new Date(initialFilters.checkIn) : null);
  const [checkOut, setCheckOut] = useState(initialFilters.checkOut ? new Date(initialFilters.checkOut) : null);
  const [guests, setGuests] = useState(initialFilters.guests || 2);

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      return;
    }
    
    onSearch?.({
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      guests
    });
  };

  return (
    <div className="bg-white rounded-full shadow-lg border border-[#DDDDDD] p-2 flex items-center gap-2 max-w-4xl mx-auto">
      {/* Check-in Date */}
      <div className="flex-1 px-4 py-2 border-r border-[#DDDDDD]">
        <label className="block text-xs font-semibold text-[#222222] mb-1">Check-in</label>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#717171]" />
          <DatePicker
            selected={checkIn}
            onChange={setCheckIn}
            selectsStart
            startDate={checkIn}
            endDate={checkOut}
            minDate={new Date()}
            placeholderText="Add date"
            className="w-full text-sm outline-none bg-transparent text-[#222222]"
            dateFormat="MMM d, yyyy"
          />
        </div>
      </div>

      {/* Check-out Date */}
      <div className="flex-1 px-4 py-2 border-r border-[#DDDDDD]">
        <label className="block text-xs font-semibold text-[#222222] mb-1">Check-out</label>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#717171]" />
          <DatePicker
            selected={checkOut}
            onChange={setCheckOut}
            selectsEnd
            startDate={checkIn}
            endDate={checkOut}
            minDate={checkIn || new Date()}
            placeholderText="Add date"
            className="w-full text-sm outline-none bg-transparent text-[#222222]"
            dateFormat="MMM d, yyyy"
          />
        </div>
      </div>

      {/* Guests */}
      <div className="flex-1 px-4 py-2 border-r border-[#DDDDDD]">
        <label className="block text-xs font-semibold text-[#222222] mb-1">Guests</label>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#717171]" />
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full text-sm outline-none bg-transparent text-[#222222] cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Button */}
      <Button 
        onClick={handleSearch}
        className="rounded-full px-6 py-4"
        disabled={!checkIn || !checkOut}
      >
        <Search className="w-5 h-5" />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </div>
  );
};

export default RoomFilterBar;
