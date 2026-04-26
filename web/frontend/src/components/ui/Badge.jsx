import React from 'react';

const Badge = ({ 
  children,
  variant = 'default',
  size = 'md'
}) => {
  const variants = {
    default: 'bg-gray-100 text-[#717171]',
    primary: 'bg-[#FF385C]/10 text-[#FF385C]',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    checked_in: 'bg-green-100 text-green-700',
    checked_out: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${variants[variant] || variants.default}
      ${sizes[size]}
    `}>
      {children}
    </span>
  );
};

export default Badge;
