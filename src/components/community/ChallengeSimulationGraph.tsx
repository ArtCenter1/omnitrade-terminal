import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Placeholder state for simulation results
interface ChallengeResult {
  opponentName: string;
  // Add relevant result data if needed later
}

export function ChallengeSimulationGraph() {
  // TODO: Add state and logic to trigger/display challenge results
  const [challengeResult, setChallengeResult] =
    React.useState<ChallengeResult | null>(null);

  // Placeholder function to simulate getting a result
  const simulateChallenge = (opponent: string) => {
    console.log(`Simulating challenge against ${opponent}`);
    // Replace with actual simulation logic
    setChallengeResult({
      opponentName: opponent,
    });
  };

  // Calculate cumulative PnL based on provided monthly data
  const userMonthlyPnl = [-12, 25, 40, 60, 120, 25];
  const opponentMonthlyPnl = [-20, -50, 19, 47, 125, 200];

  let userCumulativePnl = 0;
  let opponentCumulativePnl = 0;

  const simulationData = [
    { month: "Start", userPnl: 0, opponentPnl: 0 }, // Start point
    ...userMonthlyPnl.map((pnl, index) => {
      userCumulativePnl += pnl;
      opponentCumulativePnl += opponentMonthlyPnl[index];
      return {
        month: `Month ${index + 1}`,
        userPnl: userCumulativePnl,
        opponentPnl: opponentCumulativePnl,
      };
    }),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Head-to-Head Challenge</CardTitle>
        <CardDescription>
          {challengeResult
            ? `Simulation vs ${challengeResult.opponentName}`
            : "Challenge a user from the leaderboard."}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64 flex flex-col justify-between items-center overflow-hidden">
        {" "}
        {/* Adjust height & layout, center items */}
        {challengeResult ? (
          <div className="flex-grow w-full flex items-center justify-center">
            {/* Recharts Graph */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={simulationData} // Use the new simulation data
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /> {/* X-axis is now month */}
                <YAxis
                  label={{
                    value: "Cumulative PnL (USDT)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />{" "}
                {/* Y-axis is PnL */}
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)} USDT`}
                />{" "}
                {/* Format tooltip */}
                <Legend />
                {/* Use userPnl and opponentPnl data keys */}
                <Line
                  type="monotone"
                  dataKey="userPnl"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="Your Bot PnL"
                />
                <Line
                  type="monotone"
                  dataKey="opponentPnl"
                  stroke="#82ca9d"
                  name={`${challengeResult?.opponentName || "Opponent"} PnL`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-500 bg-gray-900/50 rounded-lg w-full">
            Click 'Challenge' on the leaderboard below.
          </div>
        )}
        {/* Placeholder button - actual trigger might be on the table row */}
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => simulateChallenge("CryptoKing")}
        >
          Test Simulate vs CryptoKing
        </Button>
      </CardContent>
    </Card>
  );
}
