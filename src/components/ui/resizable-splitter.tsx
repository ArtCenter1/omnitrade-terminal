import React, { useState, useRef, useEffect } from 'react';

interface ResizableSplitterProps {
  direction?: 'horizontal' | 'vertical';
  initialSizes?: number[];
  minSizes?: number[];
  className?: string;
  children: React.ReactNode[];
}

export function ResizableSplitter({
  direction = 'horizontal',
  initialSizes = [70, 30],
  minSizes = [20, 10],
  className = '',
  children,
}: ResizableSplitterProps) {
  const [sizes, setSizes] = useState(initialSizes);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef(0);
  const startSizesRef = useRef(sizes);

  // Handle mouse down on the splitter
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startPosRef.current = direction === 'horizontal' ? e.clientY : e.clientX;
    startSizesRef.current = [...sizes];
    document.body.style.cursor =
      direction === 'horizontal' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';

    // Add event listeners for mouse move and mouse up
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse move while dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerSize =
      direction === 'horizontal' ? containerRect.height : containerRect.width;
    const currentPos = direction === 'horizontal' ? e.clientY : e.clientX;
    const delta = currentPos - startPosRef.current;
    const deltaPercent = (delta / containerSize) * 100;

    // Calculate new sizes
    const newSizes = [...startSizesRef.current];
    newSizes[0] += deltaPercent;
    newSizes[1] -= deltaPercent;

    // Enforce minimum sizes
    if (newSizes[0] < minSizes[0]) {
      const diff = minSizes[0] - newSizes[0];
      newSizes[0] = minSizes[0];
      newSizes[1] -= diff;
    }
    if (newSizes[1] < minSizes[1]) {
      const diff = minSizes[1] - newSizes[1];
      newSizes[1] = minSizes[1];
      newSizes[0] -= diff;
    }

    setSizes(newSizes);
  };

  // Handle mouse up after dragging
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex ${direction === 'horizontal' ? 'flex-col' : 'flex-row'} ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      <div
        style={{
          [direction === 'horizontal' ? 'height' : 'width']: `${sizes[0]}%`,
          overflow: 'hidden',
        }}
      >
        {children[0]}
      </div>

      <div
        className={`${direction === 'horizontal' ? 'h-1 cursor-row-resize' : 'w-1 cursor-col-resize'}
          ${isDragging ? 'bg-purple-600' : 'bg-gray-800 hover:bg-purple-600'}
          transition-colors relative group flex items-center justify-center`}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle indicator */}
        <div
          className={`absolute ${direction === 'horizontal' ? 'w-10 h-1' : 'w-1 h-10'}
          ${isDragging ? 'bg-purple-500 opacity-100' : 'bg-gray-600 opacity-0 group-hover:opacity-100'}
          rounded-full transition-colors`}
        ></div>

        {/* Drag handle dots */}
        <div
          className={`flex ${direction === 'horizontal' ? 'flex-row space-x-1' : 'flex-col space-y-1'}
          ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
        >
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>

        {/* Invisible larger hit area for easier grabbing */}
        <div
          className={`absolute ${direction === 'horizontal' ? 'h-4 w-full top-[-8px]' : 'w-4 h-full left-[-8px]'}
          cursor-${direction === 'horizontal' ? 'row' : 'col'}-resize`}
        ></div>
      </div>

      <div
        style={{
          [direction === 'horizontal' ? 'height' : 'width']: `${sizes[1]}%`,
          overflow: 'auto',
        }}
      >
        {children[1]}
      </div>
    </div>
  );
}
