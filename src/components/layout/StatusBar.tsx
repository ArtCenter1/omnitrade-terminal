import React from 'react';

const StatusBar: React.FC = () => {
  return (
    <div className="status-bar h-6 bg-[#007acc] text-white flex items-center px-2 text-xs">
      {/* Left side items */}
      <div className="status-items-left flex items-center space-x-3">
        <div className="status-item flex items-center px-1 hover:bg-[#1f8ad2] cursor-pointer">
          <i className="icon icon-source-control mr-1"></i>
          <span>main</span>
        </div>

        <div className="status-item flex items-center px-1 hover:bg-[#1f8ad2] cursor-pointer">
          <i className="icon icon-error mr-1"></i>
          <span>0</span>
          <i className="icon icon-warning ml-2 mr-1"></i>
          <span>0</span>
        </div>
      </div>

      {/* Right side items */}
      <div className="status-items-right flex items-center space-x-3 ml-auto">
        <div className="status-item flex items-center px-1 hover:bg-[#1f8ad2] cursor-pointer">
          <span>Ln 1, Col 1</span>
        </div>

        <div className="status-item flex items-center px-1 hover:bg-[#1f8ad2] cursor-pointer">
          <span>Spaces: 2</span>
        </div>

        <div className="status-item flex items-center px-1 hover:bg-[#1f8ad2] cursor-pointer">
          <span>UTF-8</span>
        </div>

        <div className="status-item flex items-center px-1 hover:bg-[#1f8ad2] cursor-pointer">
          <span>TypeScript</span>
        </div>

        <div className="status-item flex items-center px-1 hover:bg-[#1f8ad2] cursor-pointer">
          <i className="icon icon-feedback"></i>
        </div>

        <div className="status-item flex items-center px-1 hover:bg-[#1f8ad2] cursor-pointer">
          <i className="icon icon-bell"></i>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
