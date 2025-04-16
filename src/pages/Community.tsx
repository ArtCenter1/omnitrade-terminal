import { LeaderboardFilters } from "@/components/community/LeaderboardFilters";
import { LeaderboardTable } from "@/components/community/LeaderboardTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityArena } from "@/components/community/CommunityArena";
import { OverallPerformanceGraph } from "@/components/community/OverallPerformanceGraph"; // Added import
import { ChallengeSimulationGraph } from "@/components/community/ChallengeSimulationGraph"; // Added import

export default function CommunityPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Community Leaderboards
        </h1>
        <p className="text-gray-400">
          Discover top traders, follow their strategies, and climb the ranks.
        </p>
      </div>

      {/* Grid for the two top graphs - Moved above Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <OverallPerformanceGraph />
        <ChallengeSimulationGraph />
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
          {/* Leaderboard table - Graphs are now above the Tabs component */}
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
          {/* Community Arena Integration */}
          {/* <LeaderboardFilters />  We might not need the standard filters here, or they might need adjustment */}
          <CommunityArena />
        </TabsContent>
      </Tabs>
    </div>
  );
}
