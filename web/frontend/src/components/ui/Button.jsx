import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-[#FF385C] hover:bg-[#D9324E] text-white disabled:bg-gray-300',
    secondary: 'bg-white hover:bg-gray-50 text-[#222222] border border-[#DDDDDD] disabled:bg-gray-100',
    outline: 'bg-transparent hover:bg-gray-50 text-[#222222] border border-[#DDDDDD]',
    ghost: 'bg-transparent hover:bg-gray-100 text-[#222222]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
};

export default Button;
