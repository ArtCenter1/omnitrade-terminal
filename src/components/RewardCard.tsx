import { Button } from "@/components/ui/button";

type RewardCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export function RewardCard({ icon, title, description }: RewardCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-green-500 bg-opacity-10 text-green-500 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-white font-medium mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
    </div>
  );
}
