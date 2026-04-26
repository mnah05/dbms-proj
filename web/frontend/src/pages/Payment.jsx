import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Lock, ChevronLeft, Calendar } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getMyReservations, makePayment } from '../api/client.js';
import { formatCurrency, formatDate, calculateNights } from '../utils/formatDate.js';

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    method: 'credit_card',
    billing_name: '',
    billing_email: '',
    billing_address: ''
  });

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const fetchReservation = async () => {
    try {
      const response = await getMyReservations();
      const found = response.data.find(r => r.reservation_id === parseInt(id));
      if (found) {
        setReservation(found);
        // Pre-fill billing info if available
        setFormData(prev => ({
          ...prev,
          billing_name: `${found.customer_first_name || ''} ${found.customer_last_name || ''}`.trim(),
          billing_email: found.customer_email || ''
        }));
      } else {
        setError('Reservation not found');
      }
    } catch (err) {
      setError('Failed to load reservation');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      await makePayment(id, formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    }

    setProcessing(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#222222] mb-2">Payment Successful!</h1>
          <p className="text-[#717171] mb-6">
            Your reservation has been confirmed. We've sent a confirmation email to {formData.billing_email}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/reservations')}>
              View My Reservations
            </Button>
            <Button onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => navigate('/reservations')}>View My Reservations</Button>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-[#717171] mb-4">Reservation not found</p>
        <Button onClick={() => navigate('/reservations')}>View My Reservations</Button>
      </div>
    );
  }

  const nights = calculateNights(reservation.check_in_date, reservation.check_out_date);
  const totalAmount = reservation.total_price || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#222222] hover:text-[#FF385C] mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-[#222222] mb-8">Complete Your Payment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#FF385C]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#222222]">Payment Details</h2>
                <p className="text-sm text-[#717171]">Secure SSL encryption</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'credit_card', label: 'Credit Card' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'online', label: 'Online' }
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`
                        cursor-pointer border rounded-lg p-3 text-center text-sm transition-all
                        ${formData.method === method.value
                          ? 'border-[#FF385C] bg-[#FF385C]/5 text-[#FF385C]'
                          : 'border-[#DDDDDD] hover:border-[#222222]'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={method.value}
                        checked={formData.method === method.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Billing Name"
                name="billing_name"
                value={formData.billing_name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />

              <Input
                label="Billing Email"
                name="billing_email"
                type="email"
                value={formData.billing_email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />

              <Input
                label="Billing Address (Optional)"
                name="billing_address"
                value={formData.billing_address}
                onChange={handleChange}
                placeholder="123 Main St, City, Country"
              />

              {formData.method === 'credit_card' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-[#717171]" />
                    <span className="font-medium text-[#222222]">Card Details</span>
                  </div>
                  <p className="text-sm text-[#717171]">
                    This is a demo. In production, you would integrate with a payment processor like Stripe.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={processing}
              >
                {processing ? 'Processing...' : `Pay ${formatCurrency(totalAmount)}`}
              </Button>
            </form>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-[#222222] mb-4">Reservation Summary</h2>
            
            <div className="border-b border-[#DDDDDD] pb-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-[#222222]">
                    Room {reservation.room_number} - {reservation.room_type}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-[#717171] mt-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(reservation.check_in_date)} - {formatDate(reservation.check_out_date)}
                  </div>
                </div>
                <Badge variant={reservation.status}>{reservation.status}</Badge>
              </div>
              <p className="text-sm text-[#717171]">{nights} nights • {reservation.number_of_guests} guests</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#717171]">Subtotal</span>
                <span className="text-[#222222]">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#717171]">Service fee</span>
                <span className="text-[#222222]">{formatCurrency(totalAmount * 0.1)}</span>
              </div>
            </div>

            <div className="border-t border-[#DDDDDD] pt-4 flex justify-between items-center">
              <span className="font-semibold text-[#222222]">Total</span>
              <span className="text-2xl font-bold text-[#222222]">{formatCurrency(totalAmount * 1.1)}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;
