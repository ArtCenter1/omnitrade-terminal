import React from 'react';

interface OrderTypeSelectorProps {
  activeOrderType: 'market' | 'limit' | 'stop';
  onOrderTypeChange: (orderType: 'market' | 'limit' | 'stop') => void;
}

export function OrderTypeSelector({
  activeOrderType,
  onOrderTypeChange,
}: OrderTypeSelectorProps) {
  return (
    <div className="flex w-full mb-2 border-b border-[var(--border-primary)]">
      {['market', 'limit', 'stop'].map((type) => (
        <button
          key={type}
          className={`flex-1 text-xs px-2 py-2 text-center transition-all relative ${
            activeOrderType === type
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
          onClick={() => onOrderTypeChange(type as 'market' | 'limit' | 'stop')}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
          {activeOrderType === type && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--button-primary)]"></div>
          )}
        </button>
      ))}
    </div>
  );
}
