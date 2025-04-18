import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const MarketIcon: React.FC<IconProps> = ({
  className = '',
  size = 16,
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  );
};

export const LimitIcon: React.FC<IconProps> = ({
  className = '',
  size = 16,
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
};

export const StopIcon: React.FC<IconProps> = ({
  className = '',
  size = 16,
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    </svg>
  );
};

export const BuyIcon: React.FC<IconProps> = ({
  className = '',
  size = 16,
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  );
};

export const SellIcon: React.FC<IconProps> = ({
  className = '',
  size = 16,
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
};

export const PercentageIcon: React.FC<IconProps> = ({
  className = '',
  size = 16,
  color = 'currentColor',
  children,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="17" cy="7" r="3" stroke={color} strokeWidth="2" />
      <circle cx="7" cy="17" r="3" stroke={color} strokeWidth="2" />
      <line
        x1="5.70711"
        y1="5.70711"
        x2="18.2929"
        y2="18.2929"
        stroke={color}
        strokeWidth="2"
      />
      {/* Text is added as a child */}
      {children}
    </svg>
  );
};
