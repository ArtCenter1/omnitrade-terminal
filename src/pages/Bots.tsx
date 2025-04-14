
import { Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotCard } from "@/components/BotCard";
import { mockBots } from "@/lib/utils";

export default function Bots() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Trading Bots for Everyone</h1>
        <p className="text-gray-400">
          Automate your strategies with our professionally designed trading algorithms.
        </p>
      </div>

      <p className="text-gray-400 mb-8 text-sm max-w-4xl">
        Discover a range of trusted, pre-configured, yet fully customizable trading strategies in one place and start effortlessly. Whether you're a beginner aspiring to apply sophisticated strategies or an experienced pro looking for automation, take your trading to the next level. Create your own bots easily or explore our most popular, time-tested strategies.
      </p>

      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" size={18} />
          <Input
            placeholder="Search for bots..."
            className="pl-10 bg-gray-800 border-gray-700 h-10 rounded-lg w-full"
          />
        </div>
      </div>

      <Tabs defaultValue="popular">
        <div className="border-b border-gray-800 mb-8">
          <TabsList className="bg-transparent">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              ALL BOTS
            </TabsTrigger>
            <TabsTrigger
              value="popular"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              POPULAR STRATEGIES
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              AI & SMART TRADING
            </TabsTrigger>
            <TabsTrigger
              value="signals"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              SIGNALS
            </TabsTrigger>
            <TabsTrigger
              value="technical"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              TECHNICAL ANALYSIS
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockBots.map((bot, index) => (
              <BotCard key={index} bot={bot} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="mt-0">
          <div className="mb-6">
            <h3 className="flex items-center text-sm text-primary font-medium mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              POPULAR STRATEGIES
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockBots.slice(0, 4).map((bot, index) => (
                <BotCard key={index} bot={bot} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <div className="mb-6">
            <h3 className="flex items-center text-sm text-primary font-medium mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              AI & SMART TRADING
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BotCard bot={{
                title: "Cody AI",
                description: "Innovative AI engine that dynamically analyzes markets, fine-tunes trading strategies to set parameters based on your risk tolerance, while helping you avoid possible errors.",
                icon: "/placeholder.svg",
                iconBg: "bg-blue-500 bg-opacity-10",
                tags: ["POPULAR"],
                popularity: 5,
                returns: 4
              }} />
              <BotCard bot={{
                title: "Smart Order",
                description: "Algorithmically optimized order execution to ensure minimizing slippage and maximizing profit potential. Perfect for large orders where timing is crucial.",
                icon: "/placeholder.svg",
                iconBg: "bg-yellow-500 bg-opacity-10",
                popularity: 3,
                returns: 4
              }} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="signals" className="mt-0">
          <div className="mb-6">
            <h3 className="flex items-center text-sm text-primary font-medium mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
                <line x1="2" y1="20" x2="2.01" y2="20"/>
              </svg>
              SIGNAL
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <BotCard bot={{
                title: "TradingView Bot",
                description: "Seamlessly execute your TradingView signals automatically. Link to your TradingView account, subscribe to signals, and implement strategies without worrying about manual trade execution.",
                icon: "/placeholder.svg",
                iconBg: "bg-purple-500 bg-opacity-10",
                popularity: 4,
                returns: 3
              }} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-0">
          <div className="mb-6">
            <h3 className="flex items-center text-sm text-primary font-medium mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="12" y1="20" x2="12" y2="10"/>
                <line x1="18" y1="20" x2="18" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
              TECHNICAL ANALYSIS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <BotCard bot={{
                title: "MACD",
                description: "Utilize the MACD indicator to create entry and exit signals. The bot will determine the trend direction and help time your entries with a high degree of accuracy.",
                icon: "/placeholder.svg",
                iconBg: "bg-orange-500 bg-opacity-10",
                popularity: 3,
                returns: 3
              }} />
              <BotCard bot={{
                title: "DMAC",
                description: "Leverage the power of the Dual Moving Average Crossover strategy with DMAC bot. Uses short-term and long-term moving averages to identify trend changes.",
                icon: "/placeholder.svg",
                iconBg: "bg-pink-500 bg-opacity-10",
                popularity: 4,
                returns: 3
              }} />
              <BotCard bot={{
                title: "Bollinger Bands",
                description: "A sophisticated bot that identifies overbought and oversold areas within defined trend channels. Set your preferred parameters for the indicator.",
                icon: "/placeholder.svg",
                iconBg: "bg-green-500 bg-opacity-10",
                popularity: 4,
                returns: 4
              }} />
              <BotCard bot={{
                title: "Mean Reversion",
                description: "Capitalizes on the tendency of asset prices to return to their mean over time. The bot monitors deviations from the moving average and executes contrarian trades.",
                icon: "/placeholder.svg",
                iconBg: "bg-cyan-500 bg-opacity-10",
                popularity: 3,
                returns: 4
              }} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
