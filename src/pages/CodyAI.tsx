import { LandingNavbar } from "@/components/LandingNavbar";
import { Footer } from "@/components/Footer"; // Assuming a shared Footer exists
import { Button } from "@/components/ui/button";
import { ArrowRight, BrainCircuit, Zap, ShieldCheck } from "lucide-react"; // Example icons

export function CodyAIPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <LandingNavbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Meet Cody AI
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-300 mb-6">
              Your AI-Powered Trading Co-Pilot
            </h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
              Leverage cutting-edge artificial intelligence for advanced market analysis, automated strategy generation, and intelligent risk management. Trade smarter, not harder.
            </p>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full text-lg group">
              Get Started with Cody AI <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          {/* Optional: Add illustration/image here */}
          {/* <div className="mt-12"> <img src="/cody-ai-hero.png" alt="Cody AI Illustration" className="mx-auto" /> </div> */}
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-900/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Cody AI Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700">
                <BrainCircuit className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-time Market Insights</h3>
                <p className="text-gray-400">Access AI-driven analysis of market trends, sentiment, and potential opportunities.</p>
              </div>
              {/* Feature 2 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700">
                <Zap className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Automated Strategy Backtesting</h3>
                <p className="text-gray-400">Rapidly test and validate your trading ideas against historical data.</p>
              </div>
              {/* Feature 3 */}
              <div className="bg-gray-800/60 p-6 rounded-lg shadow-lg border border-gray-700">
                <ShieldCheck className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Personalized Risk Assessment</h3>
                <p className="text-gray-400">Understand and manage your risk exposure with intelligent portfolio analysis.</p>
              </div>
            </div>
            {/* TODO: Add more sections like "How it Works", "Testimonials", Bottom CTA */}
          </div>
        </section>

      </main>
      <Footer /> {/* Add footer if applicable */}
    </div>
  );
}