import React, { useEffect, useState } from 'react';
import { RateLimitManager, RateLimitInfo } from '../services/connection/rateLimitManager';
import { ConnectionManager } from '../services/connection/connectionManager';

interface RateLimitStatusProps {
  exchangeId: string;
}

/**
 * Component to display rate limit status and controls
 */
const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ exchangeId }) => {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [preferWebSocket, setPreferWebSocket] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  useEffect(() => {
    // Get the rate limit manager instance
    const rateLimitManager = RateLimitManager.getInstance();
    
    // Get initial rate limit info
    setRateLimitInfo(rateLimitManager.getRateLimitInfo(exchangeId));
    
    // Get initial WebSocket preference
    setPreferWebSocket(rateLimitManager.getPreferWebSocket());
    
    // Register a listener for threshold events
    const unregister = rateLimitManager.registerThresholdListener(
      exchangeId,
      (info) => {
        setRateLimitInfo(info);
      }
    );
    
    // Update rate limit info every 5 seconds
    const interval = setInterval(() => {
      setRateLimitInfo(rateLimitManager.getRateLimitInfo(exchangeId));
    }, 5000);
    
    // Clean up on unmount
    return () => {
      unregister();
      clearInterval(interval);
    };
  }, [exchangeId]);
  
  // Handle WebSocket preference toggle
  const handleToggleWebSocket = () => {
    const rateLimitManager = RateLimitManager.getInstance();
    const newValue = !preferWebSocket;
    rateLimitManager.setPreferWebSocket(newValue);
    setPreferWebSocket(newValue);
  };
  
  // Calculate usage percentage
  const usagePercentage = rateLimitInfo 
    ? Math.round((rateLimitInfo.usedWeight / rateLimitInfo.weightLimit) * 100) 
    : 0;
  
  // Determine status color
  const getStatusColor = () => {
    if (!rateLimitInfo) return 'gray';
    if (rateLimitInfo.isRateLimited) return 'red';
    if (rateLimitInfo.safetyThresholdReached) return 'orange';
    if (rateLimitInfo.warningThresholdReached) return 'yellow';
    if (usagePercentage > 50) return 'blue';
    return 'green';
  };
  
  // Format time until reset
  const getTimeUntilReset = () => {
    if (!rateLimitInfo) return 'N/A';
    
    const now = Date.now();
    const resetTime = rateLimitInfo.resetTime.getTime();
    const timeLeft = resetTime - now;
    
    if (timeLeft <= 0) return 'Resetting...';
    
    const seconds = Math.floor(timeLeft / 1000);
    return `${seconds}s`;
  };
  
  if (!rateLimitInfo) {
    return null;
  }
  
  return (
    <div className="rate-limit-status">
      <div 
        className="rate-limit-indicator" 
        style={{ backgroundColor: getStatusColor() }}
        onClick={() => setIsExpanded(!isExpanded)}
        title="API Rate Limit Status"
      >
        <span className="rate-limit-percentage">{usagePercentage}%</span>
      </div>
      
      {isExpanded && (
        <div className="rate-limit-details">
          <h4>API Rate Limit Status</h4>
          <div className="rate-limit-info">
            <div>Usage: {rateLimitInfo.usedWeight} / {rateLimitInfo.weightLimit}</div>
            <div>Reset in: {getTimeUntilReset()}</div>
            {rateLimitInfo.isRateLimited && (
              <div className="rate-limit-warning">
                RATE LIMITED! Retry after {rateLimitInfo.retryAfter}s
              </div>
            )}
            {rateLimitInfo.safetyThresholdReached && !rateLimitInfo.isRateLimited && (
              <div className="rate-limit-warning">
                Safety threshold reached! Using WebSocket only.
              </div>
            )}
            {rateLimitInfo.warningThresholdReached && !rateLimitInfo.safetyThresholdReached && (
              <div className="rate-limit-warning">
                Warning threshold reached! Consider using WebSocket.
              </div>
            )}
          </div>
          
          <div className="rate-limit-controls">
            <label>
              <input
                type="checkbox"
                checked={preferWebSocket}
                onChange={handleToggleWebSocket}
              />
              Prefer WebSocket for live data
            </label>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .rate-limit-status {
          position: relative;
          display: inline-block;
        }
        
        .rate-limit-indicator {
          width: 40px;
          height: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
        
        .rate-limit-details {
          position: absolute;
          top: 100%;
          right: 0;
          width: 250px;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 1000;
        }
        
        .rate-limit-info {
          margin: 10px 0;
        }
        
        .rate-limit-warning {
          color: red;
          font-weight: bold;
          margin-top: 5px;
        }
        
        .rate-limit-controls {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  );
};

export default RateLimitStatus;
