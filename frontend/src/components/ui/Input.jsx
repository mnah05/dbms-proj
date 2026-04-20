import React from 'react';

const Input = ({ 
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#222222] mb-1.5">
          {label}
          {required && <span className="text-[#FF385C] ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`
          w-full px-4 py-3 rounded-lg border
          ${error ? 'border-red-500' : 'border-[#DDDDDD]'}
          focus:outline-none focus:border-[#222222]
          text-[#222222] placeholder-gray-400
          transition-colors
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
