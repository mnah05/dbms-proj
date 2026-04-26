import React from 'react';
import { Users, Bed } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';

const RoomTypeIcon = ({ type, size = 'md' }) => {
  const icons = {
    Standard: { icon: Bed, color: 'text-blue-600', bg: 'bg-blue-50' },
    Deluxe: { icon: Bed, color: 'text-purple-600', bg: 'bg-purple-50' },
    Suite: { icon: Bed, color: 'text-amber-600', bg: 'bg-amber-50' },
    Penthouse: { icon: Bed, color: 'text-rose-600', bg: 'bg-rose-50' }
  };

  const config = icons[type] || icons.Standard;
  const Icon = config.icon;
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizes[size]} ${config.bg} rounded-lg flex items-center justify-center`}>
      <Icon className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} ${config.color}`} />
    </div>
  );
};

const RoomCard = ({ room, onBook, showBookButton = true }) => {
  const handleBook = (e) => {
    e.stopPropagation();
    onBook?.(room);
  };

  return (
    <Card className="h-full flex flex-col" hover={!!onBook}>
      {/* Image Placeholder */}
      <div className="relative h-48 bg-gray-200 flex items-center justify-center">
        <RoomTypeIcon type={room.room_type} size="lg" />
        <div className="absolute top-3 left-3">
          <Badge variant={room.room_type.toLowerCase()}>{room.room_type}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm text-[#717171] mb-1">Room {room.room_number}</p>
            <h3 className="text-lg font-semibold text-[#222222]">{room.room_type}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-[#717171] mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Up to {room.max_occupancy} guests</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-[#DDDDDD]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[#222222]">${parseFloat(room.price_per_night).toFixed(2)}</span>
              <span className="text-[#717171] text-sm"> / night</span>
            </div>
            {showBookButton && (
              <Button onClick={handleBook} size="sm">
                Book Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export { RoomTypeIcon };
export default RoomCard;
