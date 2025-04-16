import { LandingNavbar } from "@/components/LandingNavbar";
import { Footer } from "@/components/Footer"; // Assuming a shared Footer exists
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

// Placeholder data for blog posts
const blogPosts = [
  {
    id: 1,
    title: "Understanding Market Cycles with AI",
    excerpt:
      "Learn how Cody AI analyzes historical data to predict potential market shifts...",
    imageUrl: "/placeholder.svg", // Replace with actual image path
    category: "AI Trading",
    date: "March 28, 2025",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Top 5 Grid Trading Bot Strategies",
    excerpt:
      "Explore popular grid trading strategies you can deploy instantly on OmniTrade...",
    imageUrl: "/placeholder.svg", // Replace with actual image path
    category: "Trading Bots",
    date: "March 25, 2025",
    readTime: "7 min read",
  },
  {
    id: 3,
    title: "Introducing the Omni Token: Utility & Governance",
    excerpt:
      "A deep dive into the OMNI tokenomics, staking rewards, and its role in the ecosystem...",
    imageUrl: "/placeholder.svg", // Replace with actual image path
    category: "Omni Token",
    date: "March 20, 2025",
    readTime: "6 min read",
  },
  {
    id: 4,
    title: "Advanced Risk Management Techniques",
    excerpt:
      "Protect your capital with stop-loss orders, position sizing, and portfolio diversification...",
    imageUrl: "/placeholder.svg", // Replace with actual image path
    category: "Trading Tips",
    date: "March 15, 2025",
    readTime: "8 min read",
  },
  // Add more placeholder posts as needed
];

export function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <LandingNavbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        {/* Header Section */}
        <section className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            OmniTrade Blog
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Insights, tutorials, and updates on AI trading, automated bots,
            market analysis, and the OmniTrade ecosystem.
          </p>
          {/* Optional Search Bar */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Input
              type="search"
              placeholder="Search articles..."
              className="pl-10 bg-gray-800 border-gray-700 focus:border-purple-500 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
          </div>
        </section>

        {/* Blog Post Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-900/50 rounded-lg overflow-hidden shadow-lg border border-gray-800 flex flex-col"
              >
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-4">
                    <span className="inline-block bg-purple-600/20 text-purple-400 text-xs font-semibold px-2 py-1 rounded mr-2">
                      {post.category}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {post.date} · {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 hover:text-purple-400 transition-colors cursor-pointer">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 flex-grow">
                    {post.excerpt}
                  </p>
                  <Button
                    variant="link"
                    className="p-0 text-purple-400 hover:text-purple-300 self-start group"
                  >
                    Read More{" "}
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {/* TODO: Add Pagination */}
          {/* <div className="mt-12 text-center"> <Button variant="outline">Load More Posts</Button> </div> */}
        </section>
      </main>
      <Footer /> {/* Add footer if applicable */}
    </div>
  );
}

// Add default export for the component
export default BlogPage;
