-- CreateTable
CREATE TABLE "bot_performance" (
    "performance_id" TEXT NOT NULL PRIMARY KEY,
    "bot_id" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roi" REAL NOT NULL DEFAULT 0.0,
    "win_rate" REAL NOT NULL DEFAULT 0.0,
    "max_drawdown" REAL NOT NULL DEFAULT 0.0,
    "profit_factor" REAL NOT NULL DEFAULT 0.0,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "sharpe_ratio" REAL,
    "sortino_ratio" REAL,
    "equity" REAL NOT NULL DEFAULT 0.0,
    "is_live" BOOLEAN NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bot_performance_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "trading_bots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "backtest_results" (
    "backtest_id" TEXT NOT NULL PRIMARY KEY,
    "bot_id" TEXT NOT NULL,
    "strategy_config" JSONB NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "roi" REAL NOT NULL,
    "win_rate" REAL NOT NULL,
    "max_drawdown" REAL NOT NULL,
    "profit_factor" REAL NOT NULL,
    "total_trades" INTEGER NOT NULL,
    "sharpe_ratio" REAL,
    "sortino_ratio" REAL,
    "equity_curve" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "backtest_results_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "trading_bots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "bot_performance_bot_id_idx" ON "bot_performance"("bot_id");

-- CreateIndex
CREATE INDEX "bot_performance_bot_id_is_live_idx" ON "bot_performance"("bot_id", "is_live");

-- CreateIndex
CREATE INDEX "backtest_results_bot_id_idx" ON "backtest_results"("bot_id");
