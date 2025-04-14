import React from "react";

interface BalanceItemProps {
  icon: string;
  name: string;
  amount: string;
}

function BalanceItem({ icon, name, amount }: BalanceItemProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
          <img src={icon} alt={name} className="w-full h-full object-cover" />
        </div>
        <span className="text-white">{name}</span>
      </div>
      <div className="text-white">{amount}</div>
    </div>
  );
}

export function AvailableBalances() {
  return (
    <div className="mb-6">
      <div className="text-gray-400 mb-2 text-xs">Available Balances</div>
      <div className="space-y-3">
        <BalanceItem icon="/placeholder.svg" name="BTC" amount="0.01797199" />
        <BalanceItem icon="/placeholder.svg" name="USDT" amount="0.00" />
      </div>
    </div>
  );
}
