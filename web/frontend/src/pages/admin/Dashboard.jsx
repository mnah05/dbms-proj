import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, Users, Calendar, Bed, TrendingUp, 
  ArrowRight, Activity 
} from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { getAllReservations, getAllCustomers, getRevenue, getAllRooms } from '../../api/client.js';
import { formatDate, formatCurrency } from '../../utils/formatDate.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalReservations: 0,
    totalCustomers: 0,
    totalRooms: 0,
    recentReservations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [reservationsRes, customersRes, revenueRes, roomsRes] = await Promise.all([
        getAllReservations(),
        getAllCustomers(),
        getRevenue(),
        getAllRooms()
      ]);

      const reservations = reservationsRes.data || [];
      const recent = reservations
        .sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date))
        .slice(0, 5);

      setStats({
        totalRevenue: revenueRes.data?.total_revenue || 0,
        totalReservations: reservations.length,
        totalCustomers: customersRes.data?.length || 0,
        totalRooms: roomsRes.data?.length || 0,
        recentReservations: recent
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Total Reservations',
      value: stats.totalReservations,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: Bed,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#222222]">Admin Dashboard</h1>
        <div className="text-sm text-[#717171]">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#717171] text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-[#222222]">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#222222] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => navigate('/admin/reservations')} className="justify-center">
              <Calendar className="w-4 h-4 mr-2" />
              View Reservations
            </Button>
            <Button onClick={() => navigate('/admin/rooms')} className="justify-center">
              <Bed className="w-4 h-4 mr-2" />
              Manage Rooms
            </Button>
            <Button onClick={() => navigate('/admin/customers')} variant="outline" className="justify-center">
              <Users className="w-4 h-4 mr-2" />
              View Customers
            </Button>
            <Button onClick={() => navigate('/admin/payments')} variant="outline" className="justify-center">
              <DollarSign className="w-4 h-4 mr-2" />
              View Payments
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#222222] mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-[#222222]">API Server</span>
              </div>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-[#222222]">Database</span>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Reservations */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-[#DDDDDD] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#222222]">Recent Reservations</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/reservations')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F7F7F7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDDDD]">
              {stats.recentReservations.map((res) => (
                <tr key={res.reservation_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-[#222222]">#{res.reservation_id}</td>
                  <td className="px-6 py-4 text-sm text-[#222222]">
                    {res.room_number} ({res.room_type})
                  </td>
                  <td className="px-6 py-4 text-sm text-[#222222]">
                    {res.customer_first_name} {res.customer_last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#717171]">
                    {formatDate(res.check_in_date)} - {formatDate(res.check_out_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#222222] font-medium">
                    {formatCurrency(res.total_price)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={res.status}>{res.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
