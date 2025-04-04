
import { LandingNavbar } from "@/components/LandingNavbar";
import { Footer } from "@/components/Footer"; // Assuming a shared Footer exists
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, BarChart, Settings2, CheckCircle } from "lucide-react"; // Example icons

export function TradingBotsLandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black via-blue-900/50 to-black text-white">
      <LandingNavbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
             <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
              Automate Your Trades with OmniTrade Bots
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-300 mb-6">
              Deploy Powerful Trading Bots in Minutes
            </h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
              Access a marketplace of pre-built strategies or create your own custom bots. Trade 24/7 across multiple exchanges without emotion.
            </p>
            <div className="flex justify-center space-x-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full text-lg group">
                Explore Bot Marketplace <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                 <Button size="lg" variant="outline" className="border-gray-500 hover:border-white hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-full text-lg group">
                 Create Your Own Bot
                </Button>
            </div>
          </div>
           {/* Optional: Add illustration/image here */}
           {/* <div className="mt-12"> <img src="/trading-bots-hero.png" alt="Trading Bots Illustration" className="mx-auto" /> </div> */}
        </section>

        {/* Features/Benefits Section */}
        <section className="py-16 bg-gray-900/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Why Use OmniTrade Trading Bots?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700">
                <Bot className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">24/7 Automated Trading</h3>
                <p className="text-gray-400">Never miss an opportunity. Bots trade around the clock based on your strategy.</p>
              </div>
              {/* Feature 2 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700">
                <BarChart className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Diverse Strategy Marketplace</h3>
                <p className="text-gray-400">Choose from a wide range of proven strategies developed by experts.</p>
              </div>
              {/* Feature 3 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700">
                <Settings2 className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Easy Customization</h3>
                <p className="text-gray-400">Fine-tune existing bots or build your own from scratch with our intuitive tools.</p>
              </div>
               {/* Feature 4 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Backtesting & Optimization</h3>
                <p className="text-gray-400">Test your strategies against historical data before deploying live capital.</p>
              </div>
            </div>
             {/* TODO: Add more sections like "How it Works", "Bot Examples", "Testimonials", Bottom CTA */}
          </div>
        </section>

      </main>
      <Footer /> {/* Add footer if applicable */}
    </div>
  );
}

// Add default export for the component
export default TradingBotsLandingPage;
