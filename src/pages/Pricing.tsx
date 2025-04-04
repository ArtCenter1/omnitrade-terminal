
import { LandingNavbar } from "@/components/LandingNavbar";
import { Footer } from "@/components/Footer"; // Assuming a shared Footer exists
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react"; // Check icon for features

// Define pricing tiers data structure
const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    frequency: "/ month",
    description: "Get started with essential trading tools.",
    features: [
      "Basic Market Data",
      "1 Active Trading Bot",
      "Limited Backtesting",
      "Community Support",
    ],
    cta: "Get Started Free",
    bgColor: "bg-gray-800/60",
    borderColor: "border-gray-700",
    buttonVariant: "outline",
    textColor: "text-white",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    frequency: "/ month",
    description: "Unlock advanced features for active traders.",
    features: [
      "Real-time Market Data",
      "10 Active Trading Bots",
      "Unlimited Backtesting",
      "Cody AI Basic Access",
      "Priority Support",
      "Advanced Charting Tools",
    ],
    cta: "Choose Pro Plan",
    bgColor: "bg-gradient-to-br from-purple-600/80 via-purple-800/80 to-indigo-800/80", // Highlight gradient
    borderColor: "border-purple-500",
    buttonVariant: "default", // Primary button style
    textColor: "text-white",
    highlight: true, // Mark as highlighted
  },
  {
    name: "Elite",
    price: "$99",
    frequency: "/ month",
    description: "For professional traders and institutions.",
    features: [
      "All Pro Features",
      "50 Active Trading Bots",
      "Cody AI Advanced Access",
      "API Access",
      "Dedicated Account Manager",
      "Exclusive Strategies",
    ],
    cta: "Choose Elite Plan",
    bgColor: "bg-gray-800/60",
    borderColor: "border-gray-700",
    buttonVariant: "outline",
    textColor: "text-white",
    highlight: false,
  },
];


export function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <LandingNavbar />
      <main className="flex-grow">
        {/* Header Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            Simple, transparent pricing. Select the plan that best fits your trading needs and scale as you grow.
          </p>
          {/* Optional: Add Annual/Monthly toggle here */}
        </section>

        {/* Pricing Tiers Section */}
        <section className="container mx-auto px-4 pb-20 md:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-lg shadow-xl border p-6 md:p-8 flex flex-col ${tier.bgColor} ${tier.borderColor} ${tier.highlight ? 'scale-105 z-10' : ''} transition-transform duration-300`}
              >
                {tier.highlight && (
                  <div className="text-center mb-4 -mt-10">
                    <span className="inline-block bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
                  </div>
                )}
                <h2 className={`text-2xl font-semibold mb-2 text-center ${tier.textColor}`}>{tier.name}</h2>
                <p className={`text-4xl font-bold text-center mb-1 ${tier.textColor}`}>
                  {tier.price}
                  <span className="text-lg font-normal text-gray-400">{tier.frequency}</span>
                </p>
                <p className="text-gray-400 text-center mb-6 h-12">{tier.description}</p>

                <ul className="space-y-3 mb-8 flex-grow">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className={`h-5 w-5 mr-2 ${tier.highlight ? 'text-purple-300' : 'text-green-500'}`} />
                      <span className={tier.textColor}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  variant={tier.buttonVariant as any} // Cast needed for variant type
                  className={`w-full font-semibold text-lg ${tier.highlight ? 'bg-white text-purple-700 hover:bg-gray-200' : 'border-gray-500 hover:bg-gray-700'}`}
                >
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>
           {/* TODO: Add Feature Comparison Table, FAQs */}
        </section>

      </main>
      <Footer /> {/* Add footer if applicable */}
    </div>
  );
}

// Add default export for the component
export default PricingPage;
