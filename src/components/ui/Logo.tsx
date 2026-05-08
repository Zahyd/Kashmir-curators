import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  isHero?: boolean;
}

export function Logo({ className, isHero, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 550 120"
      className={cn("w-auto", className)}
      {...props}
    >
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3E5AB" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA801E" />
        </linearGradient>
      </defs>
      
      {/* Mountain graphic */}
      <g transform="translate(10, 15)">
        {/* Back mountain */}
        <path
          d="M 60 75 L 85 25 L 115 75 Z"
          fill="url(#goldGradient)"
          opacity="0.8"
        />
        <path
          d="M 85 25 L 100 55 L 115 75 L 75 75 Z"
          fill="rgba(0,0,0,0.15)"
        />
        <path
          d="M 85 25 L 78 39 L 84 43 L 90 35 L 96 45 L 100 38 Z"
          fill="white"
        />

        {/* Front mountain */}
        <path
          d="M 20 85 L 55 15 L 90 85 Z"
          fill="url(#goldGradient)"
        />
        <path
          d="M 55 15 L 75 55 L 90 85 L 45 85 Z"
          fill="rgba(0,0,0,0.2)"
        />
        <path
          d="M 55 15 L 45 35 L 52 39 L 58 31 L 66 43 L 70 35 Z"
          fill="white"
        />
      </g>

      {/* Main Brand Text */}
      <text
        x="135"
        y="65"
        fontFamily="'Playfair Display', 'Times New Roman', Georgia, serif"
        fontSize="36"
        fontWeight="600"
        fill="currentColor"
        className={isHero ? "text-white" : "text-slate-900 dark:text-white"}
      >
        The Kashmir Curators
      </text>

      {/* Subtitle */}
      <text
        x="138"
        y="92"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="13"
        letterSpacing="6"
        fill="#D4AF37"
        fontWeight="600"
      >
        LUXURY TRAVEL
      </text>
    </svg>
  );
}
