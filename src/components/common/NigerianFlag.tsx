import React from 'react';

interface NigerianFlagProps {
  className?: string;
  aspectRatio?: '2:1' | '3:2' | '16:9';
  rounded?: boolean;
  shadow?: boolean;
  border?: boolean;
}

export const NigerianFlag: React.FC<NigerianFlagProps> = ({
  className = '',
  aspectRatio = '2:1',
  rounded = true,
  shadow = true,
  border = true,
}) => {
  // Official Nigerian Flag Specifications:
  // Proportion: 1:2 (or 2:3)
  // Three equal vertical stripes: Green (#008751), White (#FFFFFF), Green (#008751)
  const aspectClass =
    aspectRatio === '2:1' ? 'aspect-[2/1]' : aspectRatio === '3:2' ? 'aspect-[3/2]' : 'aspect-video';

  return (
    <div
      className={`relative overflow-hidden flex w-full ${aspectClass} ${
        rounded ? 'rounded-2xl sm:rounded-3xl' : ''
      } ${shadow ? 'shadow-xl shadow-emerald-950/15' : ''} ${
        border ? 'border border-slate-200/90' : ''
      } ${className}`}
      role="img"
      aria-label="National Flag of Nigeria (Green, White, Green)"
    >
      {/* Left Green Stripe (1/3) */}
      <div className="w-1/3 h-full bg-[#008751] relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />
      </div>

      {/* Middle White Stripe (1/3) */}
      <div className="w-1/3 h-full bg-[#FFFFFF] relative flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/40 to-white/90" />
      </div>

      {/* Right Green Stripe (1/3) */}
      <div className="w-1/3 h-full bg-[#008751] relative">
        <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-transparent to-transparent" />
      </div>

      {/* Subtle realistic lighting and ripple effect across the flag */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/5 via-transparent to-white/10" />
    </div>
  );
};
