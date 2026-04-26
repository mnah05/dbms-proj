import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Users, Bed, Check, Info } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { RoomTypeIcon } from '../components/rooms/RoomCard.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getAvailableRooms, createReservation } from '../api/client.js';
import { calculateNights, formatCurrency } from '../utils/formatDate.js';

const RoomDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') ? new Date(searchParams.get('check_in')) : null);
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') ? new Date(searchParams.get('check_out')) : null);
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests')) || 2);

  useEffect(() => {
    fetchRoomDetails();
  }, [id]);

  const fetchRoomDetails = async () => {
    try {
      const ci = searchParams.get('check_in') || new Date().toISOString().split('T')[0];
      const co = searchParams.get('check_out') || (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();
      const response = await getAvailableRooms({ check_in: ci, check_out: co });
      const foundRoom = response.data.find(r => r.room_id === parseInt(id));
      if (foundRoom) {
        setRoom(foundRoom);
      } else {
        setError('Room not found');
      }
    } catch (err) {
      setError('Failed to load room details');
    }
    setLoading(false);
  };

  const handleReserve = async () => {
    setBookingLoading(true);
    setError('');

    try {
      const response = await createReservation({
        room_id: parseInt(id),
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests: guests
      });

      // Navigate to reservation confirmation/payment
      navigate(`/reservations/${response.data.reservation_id}/pay`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create reservation');
    }

    setBookingLoading(false);
  };

  const nights = calculateNights(checkIn, checkOut);
  const totalPrice = room ? nights * parseFloat(room.price_per_night) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#222222] mb-4">{error || 'Room not found'}</h2>
          <Button onClick={() => navigate('/rooms')}>Browse Other Rooms</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#222222] hover:text-[#FF385C] mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Room Details */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#222222] mb-2">
              Room {room.room_number} - {room.room_type}
            </h1>
            <p className="text-[#717171]">
              Luxury accommodation with premium amenities
            </p>
          </div>

          {/* Image Placeholder */}
          <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center mb-8">
            <RoomTypeIcon type={room.room_type} size="lg" />
          </div>

          {/* Room Info */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#222222] mb-4">Room Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#717171]" />
                <span className="text-[#222222]">Up to {room.max_occupancy} guests</span>
              </div>
              <div className="flex items-center gap-3">
                <Bed className="w-5 h-5 text-[#717171]" />
                <span className="text-[#222222]">{room.room_type} Room</span>
              </div>
            </div>
          </Card>

          {/* Amenities */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#222222] mb-4">Amenities</h2>
            <div className="grid grid-cols-2 gap-3">
              {['Free WiFi', 'Air Conditioning', 'Flat-screen TV', 'Room Service', 
                'Mini Bar', 'Safe', 'Hair Dryer', 'Premium Toiletries'].map((amenity) => (
                <div key={amenity} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-[#222222]">{amenity}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* House Rules */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-[#222222] mb-4">House Rules</h2>
            <div className="space-y-2 text-[#717171]">
              <p>• Check-in: 3:00 PM - 11:00 PM</p>
              <p>• Check-out: 11:00 AM</p>
              <p>• No smoking</p>
              <p>• No pets allowed</p>
              <p>• Maximum {room.max_occupancy} guests</p>
            </div>
          </Card>
        </div>

        {/* Right Column - Booking Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="p-6 shadow-lg">
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#222222]">{formatCurrency(room.price_per_night)}</span>
                <span className="text-[#717171]"> / night</span>
              </div>

              {/* Date Selection */}
              <div className="border border-[#DDDDDD] rounded-lg overflow-hidden mb-4">
                <div className="grid grid-cols-2 divide-x divide-[#DDDDDD]">
                  <div className="p-3">
                    <label className="block text-xs font-semibold text-[#222222] mb-1">CHECK-IN</label>
                    <DatePicker
                      selected={checkIn}
                      onChange={setCheckIn}
                      selectsStart
                      startDate={checkIn}
                      endDate={checkOut}
                      minDate={new Date()}
                      placeholderText="Add date"
                      className="w-full text-sm outline-none bg-transparent"
                    />
                  </div>
                  <div className="p-3">
                    <label className="block text-xs font-semibold text-[#222222] mb-1">CHECKOUT</label>
                    <DatePicker
                      selected={checkOut}
                      onChange={setCheckOut}
                      selectsEnd
                      startDate={checkIn}
                      endDate={checkOut}
                      minDate={checkIn || new Date()}
                      placeholderText="Add date"
                      className="w-full text-sm outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div className="p-3 border-t border-[#DDDDDD]">
                  <label className="block text-xs font-semibold text-[#222222] mb-1">GUESTS</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full text-sm outline-none bg-transparent cursor-pointer"
                  >
                    {[...Array(room.max_occupancy)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} guest{i > 0 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Breakdown */}
              {nights > 0 && (
                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#222222] underline">{formatCurrency(room.price_per_night)} x {nights} nights</span>
                    <span className="text-[#222222]">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#222222]">Service fee</span>
                    <span className="text-[#222222]">{formatCurrency(totalPrice * 0.1)}</span>
                  </div>
                  <div className="border-t border-[#DDDDDD] pt-3 flex justify-between font-semibold">
                    <span className="text-[#222222]">Total</span>
                    <span className="text-[#222222]">{formatCurrency(totalPrice * 1.1)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                fullWidth
                size="lg"
                disabled={!checkIn || !checkOut || bookingLoading}
                onClick={handleReserve}
              >
                {bookingLoading ? 'Processing...' : 'Reserve'}
              </Button>

              <p className="text-center text-sm text-[#717171] mt-4 flex items-center justify-center gap-1">
                <Info className="w-4 h-4" />
                You won't be charged yet
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
