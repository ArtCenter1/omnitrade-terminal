import React from 'react';
import { LandingNavbar } from "@/components/LandingNavbar"; // Import LandingNavbar
import { Footer } from "@/components/Footer"; // Import Footer
// Assuming Button and Card components might exist or will be created later
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white"> {/* Added bg-black and text-white for consistency */}
      <LandingNavbar /> {/* Add LandingNavbar */}
      <main className="flex-grow"> {/* Wrap content in main */}
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-purple-900 to-black text-white py-20 px-4">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-4">Trade Like a Pro</h1>
            <p className="text-lg mb-8">
              Trade, monitor your portfolio, and automate any strategy with ease on leading crypto exchanges
            </p>
            {/* <Button size="lg" variant="success">Sign Up Free</Button> */}
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded">
              Sign Up Free &amp;rarr;
            </button>
          </div>
          <div>
            {/* Placeholder for the terminal image */}
            <img src="/placeholder.svg" alt="Quad Terminal Interface" className="rounded-lg shadow-xl" />
          </div>
        </div>
      </section>

      {/* Features Section 1 */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Power your crypto, your way.</h2>
          <p className="text-lg mb-12 max-w-3xl mx-auto">
            Quad Terminal is an all-in one crypto platform with a range of pro trading tools designed for traders of every skill level.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Feature Card 1 */}
            <div className="bg-purple-700 p-6 rounded-lg text-left">
              {/* Icon Placeholder */}
              <h3 className="text-xl font-semibold mb-2">Trading bot automations</h3>
              <p>No matter the market conditions, we have a bot for that. Create your own bot with Cody AI - Trading Assistant.</p>
            </div>
            {/* Feature Card 2 */}
            <div className="bg-gray-800 p-6 rounded-lg text-left">
              {/* Icon Placeholder */}
              <h3 className="text-xl font-semibold mb-2">Multi-exchange smart trading</h3>
              <p>Quad Terminal lets you trade on top-tier exchanges from one interface with charting by TradingView.</p>
            </div>
            {/* Feature Card 3 */}
            <div className="bg-gray-800 p-6 rounded-lg text-left">
              {/* Icon Placeholder */}
              <h3 className="text-xl font-semibold mb-2">Crypto portfolio tracking</h3>
              <p>All the insights you need to manage your crypto portfolio, no matter where you hold your funds.</p>
            </div>
            {/* Feature Card 4 */}
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-6 rounded-lg text-left">
              {/* Icon Placeholder */}
              <h3 className="text-xl font-semibold mb-2">Discounts for QUAD holders</h3>
              <p>Upgrade your subscription and get 50% discount on paid plans when paying with QUAD!</p>
            </div>
          </div>
          {/* <Button variant="outline">Get Started</Button> */}
          <button className="border border-white hover:bg-white hover:text-black text-white font-bold py-2 px-6 rounded">
            Get Started &amp;rarr;
          </button>
        </div>
      </section>

      {/* Feature Section 2 - Automate */}
      <section className="py-16 px-4 bg-gray-100 text-black">
         <div className="container mx-auto grid md:grid-cols-2 gap-16 items-center">
           <div> {/* Placeholder for potential image/graphic */}</div>
           <div>
            <h2 className="text-3xl font-bold mb-4">Automate virtually any strategy</h2>
            <ul className="list-disc list-inside space-y-2 mb-8">
              <li>Run pre-built bot strategies with just a few clicks.</li>
              <li>Automate trades across all your favorite exchanges.</li>
              <li>Try the future of trading automation with Cody AI.</li>
            </ul>
            {/* <Button>Learn More</Button> */}
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded">
              Learn More &amp;rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Feature Section 3 - Secure Trading */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="container mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Secure multi-exchange smart trading</h2>
            <p className="text-lg mb-8">
              Trade on all top tier exchanges from our unified terminal featuring advanced charts, order types and many other popular tools.
            </p>
            {/* <Button variant="outline">Get Started</Button> */}
            <button className="border border-white hover:bg-white hover:text-black text-white font-bold py-2 px-6 rounded">
              Get Started &amp;rarr;
            </button>
          </div>
           <div> {/* Placeholder for potential image/graphic */}</div>
        </div>
      </section>

      {/* As Featured In */}
      <section className="py-8 px-4 bg-gray-900 text-center text-gray-500">
        <div className="container mx-auto">
          AS FEATURED IN
          {/* Logos would go here */}
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="container mx-auto text-center">
          <p className="text-sm uppercase tracking-widest mb-2 text-gray-400">Premium features for a fair price</p>
          <h2 className="text-4xl font-bold mb-12">Get more from your portfolio</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12 text-left">
            {/* QUAD Token Card */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-3">The QUAD Token</h3>
              <p className="mb-6">The next-generation of high-utility platform tokens is here. QUAD gives traders premium access to trading bots and the best in discounted fees.</p>
              {/* <Button variant="outline">Get Started</Button> */}
              <button className="border border-white hover:bg-white hover:text-black text-white font-bold py-2 px-4 rounded text-sm">
                Get Started &amp;rarr;
              </button>
            </div>
            {/* Investment Management Card */}
            <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-3">All-in-one crypto investment management</h3>
              <p className="mb-6">Stay on top of your portfolio with real-time performance tracking and enhanced portfolio analytics so you know the true cost of your holdings.</p>
              {/* <Button variant="outlineWhite">Get Started</Button> */}
               <button className="border border-white bg-transparent hover:bg-white hover:text-blue-600 text-white font-bold py-2 px-4 rounded text-sm">
                Get Started &amp;rarr;
              </button>
            </div>
            {/* Coming Soon Card */}
            <div className="bg-gray-100 text-black p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-3">Coming Soon!</h3>
              <p>Our Quad Terminal Mobile Apps are being revamped. Stay tuned for updates!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="container mx-auto text-center">
           <h2 className="text-4xl font-bold mb-12">Our security-first approach<br/>to crypto trading</h2>
           <div className="bg-purple-700 p-8 rounded-lg max-w-4xl mx-auto text-left">
             <h3 className="text-3xl font-semibold mb-4">World-Class Security</h3>
             <p className="mb-6">
               With a security-first mindset, trader protection is our top priority. We go to extreme measures to keep customer data and assets safe. Each product integration undergoes rigorous testing prior to deployment.
             </p>
             <a href="#" className="text-white hover:underline font-semibold">
               Learn more about our security practices &amp;rarr;
             </a>
           </div>
        </div>
      </section>

      {/* Support/Community Section */}
      <section className="py-16 px-4 bg-gray-100 text-black">
        <div className="container mx-auto grid md:grid-cols-2 gap-8">
          {/* Support Card */}
          <div className="bg-white p-8 rounded-lg">
            <h3 className="text-2xl font-semibold mb-4">Support Center</h3>
            <p className="mb-6">
              Quad unlocks low-fee trading for bot trading, smart order trades and manual trades on connected accounts in the multi-exchange terminal.
            </p>
            <a href="#" className="text-purple-600 hover:underline font-semibold">
              See Documentation &amp;rarr;
            </a>
          </div>
          {/* Community Card */}
          <div className="bg-gray-800 text-white p-8 rounded-lg">
             <h3 className="text-2xl font-semibold mb-4">Community</h3>
            <p className="mb-6">
              Join our community on Telegram to discuss trading ideas, market happenings and anything about the platform!
            </p>
            <a href="#" className="text-green-400 hover:underline font-semibold">
              Join Telegram
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-green-900 via-black to-black text-white text-center">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-4">Trade smarter. Not harder.</h2>
          <p className="text-lg mb-8">Automate your trades and manage your portfolio from a single platform</p>
          {/* <Button size="lg" variant="success">Get Started</Button> */}
           <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded">
              Get Started &amp;rarr;
            </button>
        </div>
      </section>

      </main> {/* Close main wrapper */}
      <Footer /> {/* Add Footer */}
    </div>
  );
};

export default Index;
