
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/LandingNavbar';
import { Footer } from '@/components/Footer';
import { LeaderboardPreview } from '@/components/landing/LeaderboardPreview';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen theme-transition">
      <LandingNavbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-theme-primary text-theme-primary theme-transition">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-10 text-center">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
                  Trade Smarter with OpenTrade
                </h1>
                <p className="mx-auto max-w-[700px] text-theme-secondary md:text-xl">
                  Advanced trading platform with powerful bots, real-time market data, and a thriving community.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                  {user ? (
                    <Button size="lg" onClick={() => navigate('/dashboard')} className="bg-primary hover:bg-primary/90">
                      Go to Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button size="lg" onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                        Get Started
                      </Button>
                      <Button size="lg" variant="outline" onClick={() => navigate('/trading-bots')} className="border-gray-700 hover:bg-gray-800">
                        Explore Features
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white">Why Choose OpenTrade?</h2>
              <p className="mt-4 text-lg text-gray-400">Platform features designed for traders at all levels</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Cards */}
              <div className="flex flex-col p-6 bg-gray-800 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-white mb-2">Advanced Trading Bots</h3>
                <p className="text-gray-400 flex-grow">Automate your trading strategies and execute trades 24/7 with customizable bots.</p>
                <Button variant="link" onClick={() => navigate('/trading-bots')} className="mt-4 px-0 justify-start">
                  Learn more
                </Button>
              </div>
              <div className="flex flex-col p-6 bg-gray-800 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-white mb-2">Multi-Exchange Support</h3>
                <p className="text-gray-400 flex-grow">Connect to all major exchanges and manage your portfolio from a single dashboard.</p>
                <Button variant="link" className="mt-4 px-0 justify-start">
                  Learn more
                </Button>
              </div>
              <div className="flex flex-col p-6 bg-gray-800 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-white mb-2">Community & Leaderboards</h3>
                <p className="text-gray-400 flex-grow">Join a community of traders, compete on leaderboards, and learn from the best.</p>
                <Button variant="link" onClick={() => navigate('/community')} className="mt-4 px-0 justify-start">
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard Preview Section */}
        <section className="py-20 bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white">Top Performers</h2>
              <p className="mt-4 text-lg text-gray-400">See who's leading our trading community</p>
            </div>
            <LeaderboardPreview />
            <div className="flex justify-center mt-8">
              <Button onClick={() => navigate('/community')} className="bg-primary hover:bg-primary/90">
                View Full Leaderboard
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
