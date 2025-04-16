import React from "react";
import { Wallet, TrendingDown, PieChart } from "lucide-react";

interface PortfolioOverviewProps {
  portfolioValue: number;
  change24h: number;
  changePercent: number;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  portfolioValue,
  change24h,
  changePercent,
}) => {
  // Format numbers with commas and 2 decimal places
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Determine if change is positive or negative
  const isNegative = change24h < 0;

  return (
    <div className="dashboard-card">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="text-theme-link" size={20} />
            <h2 className="text-lg font-semibold text-theme-primary">
              Portfolio Overview
            </h2>
          </div>
          <button className="icon-button">
            <PieChart size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="portfolio-stats">
            <div>
              <p className="text-sm text-theme-secondary mb-1">
                Portfolio Value (USD)
              </p>
              <p className="portfolio-value">
                {formatCurrency(portfolioValue)}
              </p>
            </div>
          </div>

          <div className="portfolio-stats">
            <div>
              <p className="text-sm text-theme-secondary mb-1">
                24h Change (USD)
              </p>
              <p className="portfolio-change text-theme-error">
                {isNegative ? "" : "+"}
                {formatCurrency(change24h)}
              </p>
            </div>
          </div>

          <div className="portfolio-stats">
            <div>
              <p className="text-sm text-theme-secondary mb-1">
                24h Change (%)
              </p>
              <div className="flex items-center">
                <div
                  className={`portfolio-change-percent ${isNegative ? "bg-red-900/10 text-theme-error" : "bg-green-900/10 text-theme-success"}`}
                >
                  <span className="flex items-center">
                    <TrendingDown
                      className={`${isNegative ? "" : "rotate-180"} mr-1`}
                      size={14}
                    />
                    {isNegative ? "" : "+"}
                    {formatPercent(changePercent)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;
