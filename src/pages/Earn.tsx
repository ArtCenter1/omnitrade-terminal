
import { CircleDollarSign, Info, CircleCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RewardCard } from "@/components/RewardCard";

export default function Earn() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-4">Omni Rewards</h1>
        
        <Tabs defaultValue="holders">
          <TabsList className="bg-transparent border-b border-gray-800 w-full justify-start mb-8">
            <TabsTrigger 
              value="holders" 
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              OMNI Holders Program
            </TabsTrigger>
            <TabsTrigger 
              value="liquidity" 
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              OMNI Liquidity Rewards
            </TabsTrigger>
            <TabsTrigger 
              value="referral" 
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Referral Program
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="holders" className="mt-0">
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <h2 className="text-white font-medium">Benefits</h2>
                <div className="flex items-center ml-2 text-sm text-gray-400">
                  <span>Hold OMNI in your account to earn rewards and get live upgrades!</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <RewardCard 
                  icon={<CircleDollarSign size={24} />}
                  title="Earn 3% APY"
                  description="on all the OMNI held in your account, paid daily."
                />
                <RewardCard 
                  icon={<CircleCheck size={24} />}
                  title="Upgrade with OMNI"
                  description="Hold OMNI in your account to get up to a 50% discount on your subscription costs."
                />
                <RewardCard 
                  icon={<Info size={24} />}
                  title="Unlock Exclusive Perks"
                  description="Beta bots, backtests, VIP support and early access to OmniTrade's new features."
                />
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" className="flex items-center space-x-1 border-green-500 text-green-500 hover:bg-green-500 hover:bg-opacity-10">
                  <span>See full Guide</span>
                  <Info size={16} />
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white font-medium">My Rewards Tier</h2>
                <div className="text-white font-medium">OMNI Staking</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full mb-6">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Tier</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">OMNI Volume</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Discount Level</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Daily Distribution</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Support Level</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">OMNI Reward</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">APY Rate</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Amount Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 px-4 text-sm text-white">1</td>
                      <td className="py-3 px-4 text-sm text-white">$0.00 USD</td>
                      <td className="py-3 px-4 text-sm text-white">0%</td>
                      <td className="py-3 px-4 text-sm text-white">-/day</td>
                      <td className="py-3 px-4 text-sm text-white">Standard</td>
                      <td className="py-3 px-4 text-sm text-white">0 OMNI</td>
                      <td className="py-3 px-4 text-sm text-crypto-green">3%</td>
                      <td className="py-3 px-4 text-sm text-crypto-green">0 OMNI<br />$0.00 USD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" className="flex items-center space-x-1 border-green-500 text-green-500 hover:bg-green-500 hover:bg-opacity-10">
                  <span>View all program tiers</span>
                  <Info size={16} />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="liquidity" className="mt-0">
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h2 className="text-white font-medium mb-4">OMNI Liquidity Mining Program</h2>
              
              <div className="mb-6">
                <h3 className="text-gray-300 mb-4">Provide Liquidity to Earn Rewards</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-green-500 bg-opacity-10 text-green-500 rounded-full flex items-center justify-center mr-3">
                        <CircleDollarSign size={20} />
                      </div>
                      <h3 className="text-white font-medium">Earn Your Share of 100K OMNI</h3>
                    </div>
                    <p className="text-gray-400 text-sm">given away every week.</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-green-500 bg-opacity-10 text-green-500 rounded-full flex items-center justify-center mr-3">
                        <CircleCheck size={20} />
                      </div>
                      <h3 className="text-white font-medium">Earn 0.5%</h3>
                    </div>
                    <p className="text-gray-400 text-sm">from fees generated via Uniswap.</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" className="flex items-center space-x-1 border-green-500 text-green-500 hover:bg-green-500 hover:bg-opacity-10">
                    <span>See full Guide</span>
                    <Info size={16} />
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-gray-300 mb-4">How To Provide Liquidity</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="h-32 bg-gray-700 flex items-center justify-center">
                      <img src="/placeholder.svg" alt="Step 1" className="w-20 h-20 opacity-50" />
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-400 mb-1">Step 1</div>
                      <div className="text-sm text-white">Go to Uniswap Pool & Select V3 Liquidity</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="h-32 bg-gray-700 flex items-center justify-center">
                      <img src="/placeholder.svg" alt="Step 2" className="w-20 h-20 opacity-50" />
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-400 mb-1">Step 2</div>
                      <div className="text-sm text-white">Click Add To Liquidity</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="h-32 bg-gray-700 flex items-center justify-center">
                      <img src="/placeholder.svg" alt="Step 3" className="w-20 h-20 opacity-50" />
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-400 mb-1">Step 3</div>
                      <div className="text-sm text-white">Select OMNI & USDT as Pair/Pool</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="h-32 bg-gray-700 flex items-center justify-center">
                      <img src="/placeholder.svg" alt="Step 4" className="w-20 h-20 opacity-50" />
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-400 mb-1">Step 4</div>
                      <div className="text-sm text-white">Approve transaction</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-6">
                  NOTE: If liquidity you add is withdrawn prior to the end of program, you will be disqualified from rewards.
                </div>
                
                <div className="flex justify-center">
                  <Button className="bg-green-500 hover:bg-green-600 text-white flex items-center space-x-1 px-4 py-2">
                    <span>Go onsite to provide liquidity</span>
                    <Info size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="referral" className="mt-0">
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <h2 className="text-white font-medium">Benefits</h2>
                <div className="flex items-center ml-2 text-sm text-gray-400">
                  <span>Share about OmniTrade and earn up to</span>
                  <span className="text-green-500 mx-1">$100 per friend</span>
                  <span>who signs up.</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500 bg-opacity-10 text-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 7l-5 5-5-5"/>
                        <path d="M17 17l-5-5-5 5"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-medium">Share your referral code with your community</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Simple to share via social media.</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500 bg-opacity-10 text-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-medium">Earn rewards as they signup</h3>
                  </div>
                  <p className="text-gray-400 text-sm">You get $20 when they create an external wallet.</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500 bg-opacity-10 text-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-medium">The more your referrals you do, the more you earn</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Increase your pay for each additional referral.</p>
                </div>
              </div>
              
              <div className="flex justify-end mb-8">
                <Button variant="outline" className="flex items-center space-x-1 border-green-500 text-green-500 hover:bg-green-500 hover:bg-opacity-10">
                  <span>See full Guide</span>
                  <Info size={16} />
                </Button>
              </div>
              
              <div className="mb-8">
                <h3 className="text-white font-medium mb-4">Share & Earn</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">My Referral Link</div>
                    <div className="flex items-center mb-4">
                      <div className="bg-gray-800 p-2 rounded text-white text-sm flex-grow mr-2 truncate">
                        https://omnitrade.com/?r=Ga64wyTcH2ZwPoAwmNgEzu {/* Assuming domain change */}
                      </div>
                      <Button variant="outline" className="border-gray-700 hover:bg-gray-800 px-2 py-1 h-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2 mb-4">
                      <Button variant="outline" size="sm" className="border-gray-700 hover:bg-gray-800 px-2 py-1 h-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5 0-.28-.03-.56-.08-.83A7.72 7.72 0 0023 3z"/>
                        </svg>
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-700 hover:bg-gray-800 px-2 py-1 h-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                        </svg>
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-700 hover:bg-gray-800 px-2 py-1 h-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <circle cx="12" cy="12" r="4"/>
                          <line x1="21.17" y1="8" x2="12" y2="8"/>
                          <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
                          <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
                        </svg>
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-700 hover:bg-gray-800 px-2 py-1 h-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/>
                          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                        </svg>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-white font-medium mb-4">Rewards Summary</div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-800 p-3 rounded">
                        <div className="text-xs text-gray-400 mb-1">Rewards Earned</div>
                        <div className="text-lg text-white">$0.00</div>
                      </div>
                      <div className="bg-gray-800 p-3 rounded">
                        <div className="text-xs text-gray-400 mb-1">Rewards Pending</div>
                        <div className="text-lg text-white">$0.00</div>
                      </div>
                      <div className="bg-gray-800 p-3 rounded">
                        <div className="text-xs text-gray-400 mb-1">Rewards Paid</div>
                        <div className="text-lg text-crypto-green">$0.00</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
