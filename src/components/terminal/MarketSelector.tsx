import { ChevronDown } from "lucide-react";

interface MarketSelectorProps {
  image: string;
  name: string;
}

export function MarketSelector({ image, name }: MarketSelectorProps) {
  return (
    <div className="flex items-center bg-gray-900 rounded p-1">
      <div className="w-6 h-6 rounded-full overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <span className="text-white mx-2">{name}</span>
      <ChevronDown size={16} className="text-gray-500" />
    </div>
  );
}
