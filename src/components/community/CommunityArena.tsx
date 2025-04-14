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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Placeholder data - replace with actual data fetching and simulation logic
const placeholderBots = [
  { id: "bot1", name: "User Alpha's Scalper" },
  { id: "bot2", name: "Trader Beta's Swing Bot" },
  { id: "bot3", name: "My Awesome Bot" },
  { id: "bot4", name: "Community Bot X" },
  { id: "bot5", name: "Momentum Master" },
  { id: "bot6", name: "Arbitrage Ace" },
];

// Placeholder simulation data structure
const placeholderSimulationData = [
  { time: "Jan", bot1_pnl: 100, bot2_pnl: 90 },
  { time: "Feb", bot1_pnl: 150, bot2_pnl: 120 },
  { time: "Mar", bot1_pnl: 130, bot2_pnl: 180 },
  { time: "Apr", bot1_pnl: 200, bot2_pnl: 150 },
  { time: "May", bot1_pnl: 250, bot2_pnl: 220 },
  { time: "Jun", bot1_pnl: 230, bot2_pnl: 280 },
  { time: "Jul", bot1_pnl: 280, bot2_pnl: 300 },
  { time: "Aug", bot1_pnl: 310, bot2_pnl: 290 },
];

// Simple SVG Placeholder for Graph
const GraphPlaceholder = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 400 200"
    preserveAspectRatio="xMidYMid meet"
    className="text-gray-600"
  >
    {/* Grid lines */}
    <line
      x1="50"
      y1="10"
      x2="50"
      y2="170"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeDasharray="2,2"
    />
    <line
      x1="150"
      y1="10"
      x2="150"
      y2="170"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeDasharray="2,2"
    />
    <line
      x1="250"
      y1="10"
      x2="250"
      y2="170"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeDasharray="2,2"
    />
    <line
      x1="350"
      y1="10"
      x2="350"
      y2="170"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeDasharray="2,2"
    />
    <line
      x1="30"
      y1="40"
      x2="370"
      y2="40"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeDasharray="2,2"
    />
    <line
      x1="30"
      y1="90"
      x2="370"
      y2="90"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeDasharray="2,2"
    />
    <line
      x1="30"
      y1="140"
      x2="370"
      y2="140"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeDasharray="2,2"
    />
    {/* Axes */}
    <line
      x1="30"
      y1="170"
      x2="370"
      y2="170"
      stroke="currentColor"
      strokeWidth="1"
    />{" "}
    {/* X-axis */}
    <line
      x1="30"
      y1="10"
      x2="30"
      y2="170"
      stroke="currentColor"
      strokeWidth="1"
    />{" "}
    {/* Y-axis */}
    {/* Placeholder Data Lines */}
    <polyline
      points="50,150 100,100 150,120 200,80 250,90 300,50 350,60"
      fill="none"
      stroke="#8884d8"
      strokeWidth="2"
    />
    <polyline
      points="50,160 100,140 150,150 200,110 250,130 300,100 350,120"
      fill="none"
      stroke="#82ca9d"
      strokeWidth="2"
    />
    {/* Axis Labels (simplified) */}
    <text x="190" y="190" fontSize="10" fill="currentColor" textAnchor="middle">
      Time
    </text>
    <text
      x="15"
      y="95"
      fontSize="10"
      fill="currentColor"
      textAnchor="middle"
      transform="rotate(-90 15,95)"
    >
      PNL
    </text>
  </svg>
);

export function CommunityArena() {
  const [selectedBot1, setSelectedBot1] = React.useState<string | null>(null);
  const [selectedBot2, setSelectedBot2] = React.useState<string | null>(null);
  const [simulationData, setSimulationData] = React.useState<any[]>([]); // Replace 'any' with actual type
  const [isRunning, setIsRunning] = React.useState(false); // State for simulation status
  const [showResults, setShowResults] = React.useState(false); // State to control showing results area

  const handleRunSimulation = () => {
    if (selectedBot1 && selectedBot2) {
      setIsRunning(true);
      setShowResults(true); // Show results area immediately
      setSimulationData([]); // Clear previous data
      console.log(
        `Simulating battle between ${selectedBot1} and ${selectedBot2}`
      );
      // Simulate loading
      setTimeout(() => {
        // TODO: Implement actual simulation logic or fetch pre-calculated results
        setSimulationData(placeholderSimulationData); // Use placeholder for now
        setIsRunning(false);
      }, 1500); // Simulate network/computation delay
    } else {
      alert("Please select two bots to compare.");
    }
  };

  const bot1Name =
    placeholderBots.find((b) => b.id === selectedBot1)?.name || "Bot 1";
  const bot2Name =
    placeholderBots.find((b) => b.id === selectedBot2)?.name || "Bot 2";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Column 1: Controls */}
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Setup Battle</CardTitle>
            <CardDescription>Select two bots to simulate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bot Selector 1 */}
            <div>
              <label
                htmlFor="bot1-select"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Select Challenger 1
              </label>
              <Select
                onValueChange={setSelectedBot1}
                value={selectedBot1 ?? undefined}
                disabled={isRunning}
              >
                <SelectTrigger id="bot1-select">
                  <SelectValue placeholder="Choose a bot..." />
                </SelectTrigger>
                <SelectContent>
                  {placeholderBots.map((bot) => (
                    <SelectItem
                      key={bot.id}
                      value={bot.id}
                      disabled={bot.id === selectedBot2}
                    >
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bot Selector 2 */}
            <div>
              <label
                htmlFor="bot2-select"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Select Challenger 2
              </label>
              <Select
                onValueChange={setSelectedBot2}
                value={selectedBot2 ?? undefined}
                disabled={isRunning}
              >
                <SelectTrigger id="bot2-select">
                  <SelectValue placeholder="Choose another bot..." />
                </SelectTrigger>
                <SelectContent>
                  {placeholderBots.map((bot) => (
                    <SelectItem
                      key={bot.id}
                      value={bot.id}
                      disabled={bot.id === selectedBot1}
                    >
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Run Simulation Button */}
            <Button
              onClick={handleRunSimulation}
              disabled={!selectedBot1 || !selectedBot2 || isRunning}
              className="w-full"
            >
              {isRunning ? "Simulating..." : "Run Simulation"}
            </Button>
          </CardContent>
        </Card>
        {/* Potentially add other controls or info here later */}
      </div>

      {/* Column 2: Simulation Results */}
      <div className="md:col-span-2">
        <Card className="h-full flex flex-col">
          {" "}
          {/* Make card fill height and use flex column */}
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>
              {showResults
                ? isRunning
                  ? "Calculating results..."
                  : `Performance comparison: ${bot1Name} vs ${bot2Name}`
                : "Select two bots and run the simulation to see results."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {" "}
            {/* Center content vertically and horizontally */}
            {!showResults && (
              <div className="h-96 w-full flex items-center justify-center text-gray-500 bg-gray-900/50 rounded-lg">
                Awaiting simulation...
              </div>
            )}
            {showResults && isRunning && (
              <div className="h-96 w-full flex items-center justify-center text-gray-400">
                Calculating results... {/* Could add a spinner here */}
              </div>
            )}
            {showResults && !isRunning && simulationData.length > 0 && (
              <div className="h-96 w-full bg-gray-800 rounded-lg p-4">
                {/* SVG Placeholder Graph */}
                <GraphPlaceholder />
                {/* Real chart would go here */}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
