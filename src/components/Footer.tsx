import { Facebook, Twitter, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function Footer() {
  const navigate = useNavigate();

  return (
    <div className="border-t border-gray-800 mt-8 px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div>
          <h3 className="text-sm font-medium text-green-500 mb-4">Platform</h3>
          <div className="flex flex-col space-y-2">
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white"
              onClick={() => navigate("/")}>Dashboard</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white"
              onClick={() => navigate("/terminal")}>Terminal</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white"
              onClick={() => navigate("/bots")}>Bots</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white"
              onClick={() => navigate("/markets")}>Markets</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white"
              onClick={() => navigate("/earn")}>Earn</Button> {/* Added Earn link */}
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white"
              onClick={() => navigate("/community")}>Community</Button> {/* Added Community link */}
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white"
              onClick={() => navigate("/pricing")}>Pricing & Fees</Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-green-500 mb-4">Resources</h3>
          <div className="flex flex-col space-y-2">
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">Blog</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">Report a Bug</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">Request a Feature</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">Support Center</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">Referral Program</Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-green-500 mb-4">Company</h3>
          <div className="flex flex-col space-y-2">
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">About</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">Contact Us</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">Security</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">Terms of Use</Button>
            <Button variant="link" className="text-gray-400 text-sm justify-start p-0 h-auto hover:text-white">Privacy Policy</Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-green-500 mb-4">Socials</h3>
          <div className="flex space-x-4 mb-4">
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8 rounded-full">
              <Twitter size={18} className="text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8 rounded-full">
              <Facebook size={18} className="text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8 rounded-full">
              <Youtube size={18} className="text-gray-400" />
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-green-500 mb-4">Sharing is Caring</h3>
          <div className="flex flex-col space-y-3">
            <div className="text-gray-300 text-sm flex space-x-1">
              <span>Earn</span>
              <span className="text-green-400">$100 USD</span>
              <span>for each referral</span>
            </div>
            <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full text-xs px-3 py-1 h-auto flex items-center space-x-1">
              <span>Share Referral Link</span>
              <div className="bg-green-400 bg-opacity-20 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 6 15 12 9 18"></polyline>
                </svg>
              </div>
            </Button>

            <div>
              <h4 className="text-gray-300 text-sm mb-2">Available on Mobile</h4>
              <div className="text-xs text-gray-400 mb-2">(New Version Launches Soon)</div>
              <div className="flex space-x-2">
                <Button variant="outline" className="border-gray-600 bg-black hover:bg-gray-900 flex items-center space-x-1 p-1 h-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px]">Download on the</span>
                    <span className="text-sm font-medium">App Store</span>
                  </div>
                </Button>
                <Button variant="outline" className="border-gray-600 bg-black hover:bg-gray-900 flex items-center space-x-1 p-1 h-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5S3 21.33 3 20.5zm12-17c0-.83.67-1.5 1.5-1.5.63 0 1.19.4 1.41 1L22 18.8V4c0-.55-.45-1-1-1h-3.54a1.5 1.5 0 0 0-1.5-1.5c-.83 0-1.5.67-1.5 1.5H8.04c-.45 0-.88.15-1.21.42-.17-.27-.46-.42-.79-.42-.83 0-1.5.67-1.5 1.5v12.16L9 4.43c.23-.76.89-1.3 1.68-1.36.52-.04 1.01.15 1.37.5.31.31.51.73.54 1.18.36-.24.78-.38 1.22-.38.41 0 .8.1 1.14.29zm4.12 13.51 3.52 3.96c.31.35-.11.89-.53.78l-5.33-1.4c-.31-.08-.5-.37-.45-.68.12-.75-.11-1.51-.63-2.05s-1.24-.83-2-.76c-.69.09-1.31.5-1.68 1.12s-.47 1.34-.29 2.03c.1.39-.26.71-.64.65L5.75 19.4c-.35-.09-.47-.55-.25-.83L18.12 2.92c.36-.46 1.05-.46 1.41 0 .36.46.36 1.09 0 1.55l-4.73 6 3.77-.98c.38-.1.77.17.79.56l.5 9.93c0 .19-.08.35-.22.43z"/>
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px]">GET IT ON</span>
                    <span className="text-sm font-medium">Google Play</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-gray-500 text-xs leading-relaxed">
        <p className="mb-4">
          Disclaimer: Information contained herein should not be construed as an investment advice, or investment recommendation, or an order of, or solicitation for, any transactions in financial instruments;
          it makes no warranty or representation, whether express or implied, as to the accuracy or completeness of the data found herein, or as to the fitness thereof for a particular purpose. Use of images
          and symbols is made for illustrative purposes only and does not constitute a recommendation to buy, sell or hold a particular financial instrument. Use of brand logos does not necessarily imply a
          contractual relationship between us and the entities owning the logos, nor does it represent an endorsement of any such entity by OmniTrade, or vice versa. Market information is made available to
          you only as a service, and we do not endorse or approve it.
        </p>
        <p>
          Backtested or simulated performance results have inherent limitations and should not be interpreted as a recommendation to buy or sell any assets nor a guarantee of future returns. Actual results
          will vary from the analysis and OmniTrade makes no representation or warranty regarding future performance.
        </p>

        <div className="text-center mt-8">
          Copyright © OmniTrade Global, Ltd (BVI) {/* Assuming company name change too */}
        </div>
      </div>
    </div>
  );
}
