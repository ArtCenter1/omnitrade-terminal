import { LandingNavbar } from "@/components/LandingNavbar";
import { Footer } from "@/components/Footer"; // Assuming a shared Footer exists
import { Button } from "@/components/ui/button";
import { ArrowRight, Layers, Zap, Lock, PieChart, ShoppingCart } from "lucide-react"; // Example icons

export function QuadTokenPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black via-emerald-900/50 to-black text-white">
      <LandingNavbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
             {/* Optional: Token Icon */}
             {/* <img src="/quad-token-icon.svg" alt="QUAD Token Icon" className="h-16 w-16 mx-auto mb-4" /> */}
             <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500">
              The QUAD Token
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-300 mb-6">
              Powering the QUAD Terminal Ecosystem
            </h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
              QUAD is the native utility and governance token, unlocking premium features, rewards, and participation in the platform's future.
            </p>
            <div className="flex justify-center space-x-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-full text-lg group">
                Get QUAD Token <ShoppingCart className="ml-2 h-5 w-5" />
                </Button>
                 <Button size="lg" variant="outline" className="border-gray-500 hover:border-white hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-full text-lg group">
                 Read Whitepaper <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
          </div>
        </section>

        {/* Utility Section */}
        <section className="py-16 bg-gray-900/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">QUAD Token Utility</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Utility 1 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700 text-center">
                <Layers className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Reduced Trading Fees</h3>
                <p className="text-gray-400">Hold or stake QUAD tokens to enjoy significant discounts on platform fees.</p>
              </div>
              {/* Utility 2 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700 text-center">
                <Zap className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Access Premium Features</h3>
                <p className="text-gray-400">Unlock advanced analytics, exclusive bot strategies, and early access to new tools.</p>
              </div>
              {/* Utility 3 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700 text-center">
                <Lock className="h-12 w-12 text-teal-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Staking Rewards</h3>
                <p className="text-gray-400">Earn passive income by staking your QUAD tokens and contributing to the network.</p>
              </div>
               {/* Utility 4 (Placeholder) */}
               <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700 text-center md:col-span-2 lg:col-span-1 lg:col-start-2">
                <PieChart className="h-12 w-12 text-cyan-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Governance & Voting</h3>
                <p className="text-gray-400">Participate in platform decisions and shape the future of QUAD Terminal.</p>
              </div>
            </div>
          </div>
        </section>

         {/* Tokenomics Section (Placeholder) */}
        <section className="py-16">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-12">Tokenomics</h2>
                <div className="bg-gray-800/60 p-8 rounded-lg shadow-lg border border-gray-700 max-w-3xl mx-auto">
                    <p className="text-gray-400">Detailed token distribution, supply schedule, and economic model information will be presented here.</p>
                    {/* TODO: Add charts and specific tokenomics data based on the image/whitepaper */}
                     <div className="mt-6">
                        <Button variant="link" className="text-emerald-400 hover:text-emerald-300 group">
                            View Detailed Tokenomics <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>

      </main>
      <Footer /> {/* Add footer if applicable */}
    </div>
  );
}