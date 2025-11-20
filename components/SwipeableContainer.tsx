'use client';

import { useState, useRef, ReactNode } from 'react';

interface SwipeableContainerProps {
  containers: {
    id: string;
    component: ReactNode;
  }[];
}

export default function SwipeableContainer({ containers }: SwipeableContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Threshold for swipe (30% of container width)
    const threshold = window.innerWidth * 0.3;
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        // Swipe right - go to previous
        setCurrentIndex((prev) => (prev - 1 + containers.length) % containers.length);
      } else {
        // Swipe left - go to next
        setCurrentIndex((prev) => (prev + 1) % containers.length);
      }
    }
    
    setTranslateX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    setTranslateX(diff);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    const threshold = window.innerWidth * 0.3;
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        setCurrentIndex((prev) => (prev - 1 + containers.length) % containers.length);
      } else {
        setCurrentIndex((prev) => (prev + 1) % containers.length);
      }
    }
    
    setTranslateX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {containers.map((container) => (
          <div
            key={container.id}
            className="min-w-full flex items-center justify-center"
            style={{ width: '100%' }}
          >
            {container.component}
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {containers.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-black w-6'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
