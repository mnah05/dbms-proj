import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, CheckCircle, XCircle, Clock } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Input from '../../components/ui/Input.jsx';
import { getAllReservations, updateReservationStatus } from '../../api/client.js';
import { formatDate, formatCurrency, calculateNights } from '../../utils/formatDate.js';

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const statusOptions = ['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchQuery, statusFilter]);

  const fetchReservations = async () => {
    try {
      const response = await getAllReservations();
      setReservations(response.data || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
    setLoading(false);
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(res =>
        res.customer_first_name?.toLowerCase().includes(query) ||
        res.customer_last_name?.toLowerCase().includes(query) ||
        res.room_number?.toLowerCase().includes(query) ||
        res.reservation_id?.toString().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(res => res.status === statusFilter);
    }

    setFilteredReservations(filtered);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReservation || !updateStatus) return;

    setUpdating(true);
    try {
      await updateReservationStatus(selectedReservation.reservation_id, updateStatus);
      await fetchReservations();
      setIsUpdateModalOpen(false);
      setSelectedReservation(null);
      setUpdateStatus('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
    setUpdating(false);
  };

  const openUpdateModal = (reservation) => {
    setSelectedReservation(reservation);
    setUpdateStatus(reservation.status);
    setIsUpdateModalOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'checked_in':
      case 'checked_out':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
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
        <h1 className="text-3xl font-bold text-[#222222]">Reservations</h1>
        <div className="flex items-center gap-2 text-sm text-[#717171]">
          Total: <span className="font-semibold text-[#222222]">{filteredReservations.length}</span>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717171]" />
            <input
              type="text"
              placeholder="Search by guest name, room, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#DDDDDD] rounded-lg focus:outline-none focus:border-[#222222]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#717171]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-[#DDDDDD] rounded-lg focus:outline-none focus:border-[#222222] bg-white"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Reservations Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F7F7F7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDDDD]">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[#717171]">
                    No reservations found
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => (
                  <tr key={res.reservation_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-[#222222]">#{res.reservation_id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#222222]">
                          {res.customer_first_name} {res.customer_last_name}
                        </p>
                        <p className="text-xs text-[#717171]">{res.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#222222]">
                      {res.room_number} <span className="text-[#717171]">({res.room_type})</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#717171]">
                      <div>
                        <p>{formatDate(res.check_in_date)} -</p>
                        <p>{formatDate(res.check_out_date)}</p>
                        <p className="text-xs mt-1">{calculateNights(res.check_in_date, res.check_out_date)} nights</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#222222]">
                      {formatCurrency(res.total_price)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={res.status}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(res.status)}
                          {res.status.replace('_', ' ')}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateModal(res)}
                      >
                        Update Status
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Update Status Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Reservation Status"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-[#717171]">Reservation #{selectedReservation.reservation_id}</p>
              <p className="font-medium text-[#222222]">
                {selectedReservation.customer_first_name} {selectedReservation.customer_last_name}
              </p>
              <p className="text-sm text-[#717171]">
                Room {selectedReservation.room_number} • {formatDate(selectedReservation.check_in_date)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#222222] mb-2">New Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full px-4 py-2 border border-[#DDDDDD] rounded-lg focus:outline-none focus:border-[#222222]"
              >
                {statusOptions.filter(s => s !== 'all').map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsUpdateModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updating || updateStatus === selectedReservation.status}
                className="flex-1"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReservations;
