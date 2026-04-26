import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, CreditCard, XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getMyReservations, cancelReservation } from '../api/client.js';
import { formatDate, formatCurrency, calculateNights } from '../utils/formatDate';

const MyReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelLoading, setCancelLoading] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await getMyReservations();
      setReservations(response.data || []);
    } catch (err) {
      setError('Failed to load reservations');
    }
    setLoading(false);
  };

  const handleCancel = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    
    setCancelLoading(reservationId);
    try {
      await cancelReservation(reservationId);
      await fetchReservations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel reservation');
    }
    setCancelLoading(null);
  };

  const handlePay = (reservation) => {
    navigate(`/reservations/${reservation.reservation_id}/pay`);
  };

  const now = new Date();
  
  const filteredReservations = reservations.filter(res => {
    const checkOut = new Date(res.check_out_date);
    const checkIn = new Date(res.check_in_date);
    
    if (activeTab === 'upcoming') {
      return checkOut >= now && res.status !== 'cancelled';
    } else if (activeTab === 'past') {
      return checkOut < now && res.status !== 'cancelled';
    } else if (activeTab === 'cancelled') {
      return res.status === 'cancelled';
    }
    return true;
  });

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'pending',
      confirmed: 'confirmed',
      checked_in: 'checked_in',
      checked_out: 'checked_out',
      cancelled: 'cancelled'
    };
    return variants[status] || 'default';
  };

  const getStatusIcon = (status) => {
    if (status === 'confirmed' || status === 'checked_in') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'pending') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    if (status === 'cancelled') return <XCircle className="w-4 h-4 text-red-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-[#222222] mb-8">My Reservations</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[#DDDDDD]">
        {['upcoming', 'past', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-[#222222] border-b-2 border-[#222222]'
                : 'text-[#717171] hover:text-[#222222]'
            }`}
          >
            {tab}
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {reservations.filter(res => {
                const checkOut = new Date(res.check_out_date);
                if (tab === 'upcoming') return checkOut >= now && res.status !== 'cancelled';
                if (tab === 'past') return checkOut < now && res.status !== 'cancelled';
                if (tab === 'cancelled') return res.status === 'cancelled';
                return true;
              }).length}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-[#DDDDDD] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#222222] mb-2">No {activeTab} reservations</h3>
          <p className="text-[#717171] mb-6">
            {activeTab === 'upcoming' 
              ? "You don't have any upcoming trips. Time to plan your next stay!"
              : `You don't have any ${activeTab} reservations.`}
          </p>
          {activeTab === 'upcoming' && (
            <Button onClick={() => navigate('/rooms')}>Explore Rooms</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.reservation_id} className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Room Image Placeholder */}
                <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-8 h-8 text-[#717171]" />
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={getStatusVariant(reservation.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(reservation.status)}
                        {reservation.status.replace('_', ' ')}
                      </span>
                    </Badge>
                    {reservation.payment_status && (
                      <Badge variant={reservation.payment_status === 'completed' ? 'success' : 'pending'}>
                        Payment: {reservation.payment_status}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-[#222222] mb-1">
                    Room {reservation.room_number} - {reservation.room_type}
                  </h3>

                  <div className="flex items-center gap-4 text-[#717171] text-sm mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(reservation.check_in_date)} - {formatDate(reservation.check_out_date)}
                    </span>
                    <span>•</span>
                    <span>{calculateNights(reservation.check_in_date, reservation.check_out_date)} nights</span>
                    <span>•</span>
                    <span>{reservation.number_of_guests} guests</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-[#222222]">
                        {formatCurrency(reservation.total_price)}
                      </span>
                      <span className="text-[#717171] text-sm"> total</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {reservation.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handlePay(reservation)}
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Pay Now
                        </Button>
                      )}
                      {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(reservation.reservation_id)}
                          disabled={cancelLoading === reservation.reservation_id}
                        >
                          {cancelLoading === reservation.reservation_id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReservations;
