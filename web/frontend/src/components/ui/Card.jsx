import React from 'react';

const Card = ({ 
  children, 
  className = '',
  hover = false,
  onClick
}) => {
  const baseStyles = 'bg-white rounded-xl border border-[#DDDDDD] overflow-hidden';
  const hoverStyles = hover ? 'hover:shadow-lg hover:border-[#222222] cursor-pointer transition-all duration-200' : '';

  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
