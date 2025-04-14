import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data - replace with actual data fetching (top 3-5)
const mockTopTraders = [
  {
    rank: 1,
    name: "CryptoKing",
    avatar: "",
    pnl: "+$15,234.56",
    isVerified: true,
  },
  {
    rank: 2,
    name: "WhaleWatcher",
    avatar: "",
    pnl: "+$12,876.12",
    isVerified: true,
  },
  {
    rank: 3,
    name: "AltcoinNinja",
    avatar: "",
    pnl: "+$10,555.89",
    isVerified: false,
  },
  // Add more if needed, e.g., top 5
  // { rank: 4, name: "DeFiDegen", avatar: "", pnl: "+$9,876.00", isVerified: true },
  // { rank: 5, name: "HodlerSupreme", avatar: "", pnl: "+$8,123.45", isVerified: false },
];

export function LeaderboardPreview() {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          Top Traders (30d PNL)
        </h3>
        <Link to="/community">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            View All
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </Link>
      </div>
      <div className="space-y-4">
        {mockTopTraders.map((trader) => (
          <div
            key={trader.rank}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-md"
          >
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-400 w-4 text-center">
                {trader.rank}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={trader.avatar || "/placeholder.svg"}
                  alt={trader.name}
                />
                <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium text-sm text-white block">
                  {trader.name}
                </span>
                {trader.isVerified && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-400 border-none text-xs px-1.5 py-0.5 mt-0.5"
                  >
                    Verified
                  </Badge>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-crypto-green">
              {trader.pnl}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
