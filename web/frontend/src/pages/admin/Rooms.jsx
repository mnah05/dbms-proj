import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Bed } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { getAllRooms, createRoom, updateRoom } from '../../api/client.js';
import { formatCurrency } from '../../utils/formatDate.js';

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'Standard',
    price_per_night: '',
    max_occupancy: 2
  });

  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Penthouse'];

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredRooms(rooms.filter(room =>
        room.room_number.toLowerCase().includes(query) ||
        room.room_type.toLowerCase().includes(query)
      ));
    } else {
      setFilteredRooms(rooms);
    }
  }, [rooms, searchQuery]);

  const fetchRooms = async () => {
    try {
      const response = await getAllRooms();
      setRooms(response.data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.room_id, formData);
      } else {
        await createRoom(formData);
      }
      await fetchRooms();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save room');
    }

    setSubmitting(false);
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      room_number: '',
      room_type: 'Standard',
      price_per_night: '',
      max_occupancy: 2
    });
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      price_per_night: room.price_per_night,
      max_occupancy: room.max_occupancy
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_occupancy' ? parseInt(value) || 0 : value
    }));
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
        <h1 className="text-3xl font-bold text-[#222222]">Room Management</h1>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717171]" />
          <input
            type="text"
            placeholder="Search by room number or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#DDDDDD] rounded-lg focus:outline-none focus:border-[#222222]"
          />
        </div>
      </Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.room_id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <Bed className="w-6 h-6 text-[#717171]" />
              </div>
              <Badge variant={room.room_type.toLowerCase()}>{room.room_type}</Badge>
            </div>

            <h3 className="text-xl font-semibold text-[#222222] mb-1">
              Room {room.room_number}
            </h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#717171]">Price per night</span>
                <span className="font-medium text-[#222222]">{formatCurrency(room.price_per_night)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#717171]">Max occupancy</span>
                <span className="font-medium text-[#222222]">{room.max_occupancy} guests</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => openEditModal(room)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Bed className="w-16 h-16 text-[#DDDDDD] mx-auto mb-4" />
          <p className="text-[#717171]">No rooms found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRoom ? 'Edit Room' : 'Add New Room'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Room Number"
            name="room_number"
            value={formData.room_number}
            onChange={handleChange}
            required
            placeholder="e.g., 101"
          />

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1.5">
              Room Type
            </label>
            <select
              name="room_type"
              value={formData.room_type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-[#DDDDDD] focus:outline-none focus:border-[#222222] bg-white"
            >
              {roomTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <Input
            label="Price per Night"
            name="price_per_night"
            type="number"
            step="0.01"
            value={formData.price_per_night}
            onChange={handleChange}
            required
            placeholder="99.99"
          />

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1.5">
              Max Occupancy
            </label>
            <select
              name="max_occupancy"
              value={formData.max_occupancy}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-[#DDDDDD] focus:outline-none focus:border-[#222222] bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} guests</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Saving...' : (editingRoom ? 'Update Room' : 'Create Room')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminRooms;
