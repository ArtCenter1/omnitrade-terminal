import { Button } from "@/components/ui/button";

type BotCardProps = {
  bot: {
    title: string;
    description: string;
    icon: string;
    iconBg: string;
    tags?: string[];
    popularity?: number;
    returns?: number;
  };
};

export function BotCard({ bot }: BotCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start mb-3">
          <div
            className={`w-12 h-12 ${bot.iconBg} rounded-full flex items-center justify-center mr-4`}
          >
            <img
              src={bot.icon || "/placeholder.svg"}
              alt={bot.title}
              className="w-6 h-6"
            />
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-white font-medium">{bot.title}</h3>
              {bot.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-1">{bot.description}</p>
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-500 mt-4 mb-4">
          {bot.popularity && (
            <div className="flex items-center mr-4">
              <span className="mr-1">Popularity:</span>
              <div className="flex space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-4 rounded-sm ${i < bot.popularity! ? "bg-purple-500" : "bg-gray-700"}`}
                  />
                ))}
              </div>
            </div>
          )}

          {bot.returns && (
            <div className="flex items-center">
              <span className="mr-1">Returns:</span>
              <div className="flex space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-4 rounded-sm ${i < bot.returns! ? "bg-purple-500" : "bg-gray-700"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <Button className="bg-gray-800 hover:bg-gray-700 text-white rounded-full text-xs w-full">
          <span>Create Bot</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 16 16 12 12 8" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
