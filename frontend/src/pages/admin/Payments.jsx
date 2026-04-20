import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { getAllPayments } from '../../api/client.js';
import { formatDate, formatCurrency, formatDateTime } from '../../utils/formatDate.js';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    refundedCount: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await getAllPayments();
      const data = response.data || [];
      setPayments(data);

      // Calculate stats
      const total = data.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const completed = data.filter(p => p.status === 'completed').length;
      const pending = data.filter(p => p.status === 'pending').length;
      const refunded = data.filter(p => p.status === 'refunded').length;

      setStats({
        totalAmount: total,
        completedCount: completed,
        pendingCount: pending,
        refundedCount: refunded
      });
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'refunded':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getMethodIcon = (method) => {
    return <CreditCard className="w-4 h-4 text-[#717171]" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-[#222222]">Payments</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#717171] text-sm mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-[#222222]">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#717171] text-sm mb-1">Completed</p>
              <p className="text-2xl font-bold text-[#222222]">{stats.completedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#717171] text-sm mb-1">Pending</p>
              <p className="text-2xl font-bold text-[#222222]">{stats.pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#717171] text-sm mb-1">Refunded</p>
              <p className="text-2xl font-bold text-[#222222]">{stats.refundedCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F7F7F7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Reservation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Billed To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDDDD]">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[#717171]">
                    <CreditCard className="w-12 h-12 text-[#DDDDDD] mx-auto mb-3" />
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.payment_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-[#222222]">#{payment.payment_id}</td>
                    <td className="px-6 py-4 text-sm text-[#222222]">
                      Reservation #{payment.reservation_id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#222222]">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.method)}
                        <span className="text-sm text-[#222222] capitalize">
                          {payment.method.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={payment.status}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#717171]">
                      {formatDateTime(payment.payment_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#717171]">
                      <div>
                        <p className="text-[#222222]">{payment.billing_name}</p>
                        <p className="text-xs">{payment.billing_email}</p>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminPayments;
