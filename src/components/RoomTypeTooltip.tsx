import { useState } from 'react';
import { Info } from 'lucide-react';

interface RoomTypeTooltipProps {
  roomType: string;
  description: string;
}

export function RoomTypeTooltip({ roomType, description }: RoomTypeTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <span className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground cursor-pointer hover:bg-accent/80 transition-colors flex items-center gap-1">
        {roomType}
        <Info className="h-3 w-3 opacity-60" />
      </span>
      
      {showTooltip && (
        <div className="absolute z-50 w-72 p-3 mt-2 text-sm bg-card border rounded-lg shadow-lg left-0 top-full">
          <div className="font-medium text-foreground mb-1">{roomType}</div>
          <div className="text-muted-foreground text-xs leading-relaxed">{description}</div>
          <div className="absolute w-2 h-2 bg-card border transform rotate-45 -top-1 left-4"></div>
        </div>
      )}
    </div>
  );
}
