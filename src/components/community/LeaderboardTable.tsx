import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

// Mock data - replace with actual data fetching
const mockLeaderboardData = [
  { rank: 1, name: "CryptoKing", avatar: "", pnl: "+$15,234.56", winRate: "78%", trades: 120, isVerified: true, isFollowing: false },
  { rank: 2, name: "WhaleWatcher", avatar: "", pnl: "+$12,876.12", winRate: "72%", trades: 95, isVerified: true, isFollowing: true },
  { rank: 3, name: "AltcoinNinja", avatar: "", pnl: "+$10,555.89", winRate: "65%", trades: 150, isVerified: false, isFollowing: false },
  { rank: 4, name: "DeFiDegen", avatar: "", pnl: "+$9,876.00", winRate: "68%", trades: 88, isVerified: true, isFollowing: false },
  { rank: 5, name: "HodlerSupreme", avatar: "", pnl: "+$8,123.45", winRate: "85%", trades: 50, isVerified: false, isFollowing: true },
  { rank: 6, name: "ShillMaster", avatar: "", pnl: "+$7,500.00", winRate: "55%", trades: 210, isVerified: false, isFollowing: false },
  { rank: 7, name: "DiamondHands", avatar: "", pnl: "+$6,999.99", winRate: "90%", trades: 30, isVerified: true, isFollowing: false },
  { rank: 8, name: "MoonLambo", avatar: "", pnl: "+$6,543.21", winRate: "60%", trades: 110, isVerified: false, isFollowing: false },
  { rank: 9, name: "YieldFarmer", avatar: "", pnl: "+$5,800.75", winRate: "75%", trades: 75, isVerified: true, isFollowing: true },
  { rank: 10, name: "BTCMaxi", avatar: "", pnl: "+$5,111.00", winRate: "82%", trades: 60, isVerified: false, isFollowing: false },
];

export function LeaderboardTable() {
  return (
    <div className="bg-theme-card rounded-lg overflow-hidden shadow-theme-md theme-transition">
      <Table>
        <TableHeader>
          <TableRow className="border-theme-primary hover:bg-theme-hover theme-transition">
            <TableHead className="w-[50px] text-theme-tertiary">Rank</TableHead>
            <TableHead className="text-theme-tertiary">Trader</TableHead>
            <TableHead className="text-right text-theme-tertiary">PNL (30d)</TableHead>
            <TableHead className="text-right text-theme-tertiary">Win Rate (30d)</TableHead>
            <TableHead className="text-right text-theme-tertiary">Trades (30d)</TableHead>
            <TableHead className="text-center text-theme-tertiary">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockLeaderboardData.map((trader) => (
            <TableRow key={trader.rank} className="border-theme-primary hover:bg-theme-hover theme-transition">
              <TableCell className="font-medium text-theme-primary">{trader.rank}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={trader.avatar || "/placeholder.svg"} alt={trader.name} />
                    <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-theme-primary">{trader.name}</span>
                  {trader.isVerified && <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-none text-xs px-1.5 py-0.5">Verified</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-right text-crypto-green">{trader.pnl}</TableCell>
              <TableCell className="text-right text-theme-primary">{trader.winRate}</TableCell>
              <TableCell className="text-right text-theme-primary">{trader.trades}</TableCell>
              <TableCell className="text-center">
                <Button variant={trader.isFollowing ? "secondary" : "outline"} size="sm" className={`h-8 text-xs ${trader.isFollowing ? 'bg-theme-tertiary hover:bg-theme-hover text-theme-primary' : 'border-theme-primary hover:bg-theme-hover text-theme-secondary'} theme-transition`}>
                  <Star size={14} className={`mr-1 ${trader.isFollowing ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
                  {trader.isFollowing ? 'Following' : 'Follow'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}