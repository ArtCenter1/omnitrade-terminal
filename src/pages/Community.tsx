import { LeaderboardFilters } from "@/components/community/LeaderboardFilters";
import { LeaderboardTable } from "@/components/community/LeaderboardTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CommunityPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Community Leaderboards</h1>
        <p className="text-gray-400">
          Discover top traders, follow their strategies, and climb the ranks.
        </p>
      </div>

      {/* Tabs for different leaderboards (e.g., PNL, Win Rate, Backtest) */}
      <Tabs defaultValue="pnl">
        <TabsList className="bg-transparent border-b border-gray-800 w-full justify-start mb-6">
          <TabsTrigger
            value="pnl"
            className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            PNL Leaderboard (30d)
          </TabsTrigger>
          <TabsTrigger
            value="winrate"
            className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Win Rate Leaderboard (30d)
          </TabsTrigger>
           <TabsTrigger
            value="backtest"
            className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Backtest Leaderboard
          </TabsTrigger>
          {/* Add more tabs as needed */}
        </TabsList>

        <TabsContent value="pnl" className="mt-0">
          <LeaderboardFilters />
          <LeaderboardTable />
          {/* Add Pagination if needed */}
        </TabsContent>

        <TabsContent value="winrate" className="mt-0">
          {/* Placeholder for Win Rate Leaderboard - Can reuse Filters/Table with different data/sorting */}
           <LeaderboardFilters />
           <div className="p-8 text-center text-gray-400 bg-gray-900 rounded-lg">
             <p>Win Rate Leaderboard data coming soon.</p>
           </div>
        </TabsContent>

         <TabsContent value="backtest" className="mt-0">
          {/* Placeholder for Backtest Leaderboard */}
           <LeaderboardFilters />
           <div className="p-8 text-center text-gray-400 bg-gray-900 rounded-lg">
             <p>Backtest Leaderboard data coming soon.</p>
           </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}