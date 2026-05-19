import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  isHero?: boolean;
}

export function Logo({ className, isHero, ...props }: LogoProps) {
  // We use adaptive text coloring for the main brand text if it's not strictly 3D gold
  const textColor = isHero ? "text-white" : "text-[#020617] dark:text-white";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 650 140"
      className={cn("w-auto", className)}
      {...props}
    >
      <defs>
        {/* 3D Sun Radial Glow */}
        <radialGradient id="sun3D" cx="50%" cy="70%" r="70%" fx="50%" fy="80%">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="30%" stopColor="#FCD34D" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#C2410C" />
        </radialGradient>
        
        {/* 3D Metallic Gold Gradient */}
        <linearGradient id="gold3D" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="30%" stopColor="#D97706" />
          <stop offset="60%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* 3D Mountain Deep Layering */}
        <linearGradient id="mountainBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="mountainMid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="mountainFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>

        {/* 3D Snow Caps */}
        <linearGradient id="snow3D" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>

        {/* 3D Platinum Airplane */}
        <linearGradient id="plane3D" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Drop Shadows for Depth */}
        <filter id="shadow3D" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
        </filter>
        <filter id="shadowLight" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.3" />
        </filter>
        <filter id="glow3D" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g transform="translate(15, 10)">
        {/* Glowing 3D Sun */}
        <circle cx="70" cy="65" r="48" fill="url(#sun3D)" filter="url(#glow3D)" />
        
        {/* Dynamic Horizon Clouds / Mist */}
        <path d="M 0 50 Q 70 45 140 50 L 140 54 Q 70 49 0 54 Z" fill="#000000" opacity="0.25" filter="url(#shadowLight)" />
        <path d="M -10 65 Q 70 60 150 65 L 150 70 Q 70 65 -10 70 Z" fill="#000000" opacity="0.35" filter="url(#shadowLight)" />

        {/* Back Mountain Layer */}
        <g filter="url(#shadowLight)">
          <path d="M 65 95 L 105 40 L 145 95 Z" fill="url(#mountainBack)" />
          <path d="M 105 40 L 115 58 L 108 62 L 105 55 L 98 62 L 95 56 Z" fill="url(#snow3D)" opacity="0.9" />
        </g>

        {/* Mid Mountain Layer */}
        <g filter="url(#shadow3D)">
          <path d="M -5 95 L 40 30 L 85 95 Z" fill="url(#mountainMid)" />
          <path d="M 40 30 L 50 48 L 44 52 L 40 45 L 32 52 L 28 46 Z" fill="url(#snow3D)" opacity="0.95" />
        </g>

        {/* Front Mountain Layer */}
        <g filter="url(#shadow3D)">
          <path d="M 25 95 L 70 15 L 115 95 Z" fill="url(#mountainFront)" />
          <path d="M 70 15 L 85 45 L 76 50 L 70 40 L 60 50 L 52 42 Z" fill="url(#snow3D)" />
        </g>

        {/* Majestic Palm Silhouette Layer */}
        <g filter="url(#shadow3D)" transform="translate(-15, 0) scale(0.95)">
          {/* Main Tree */}
          <path d="M 42 100 Q 30 60 48 20 Q 52 50 48 100 Z" fill="url(#mountainFront)" />
          <path d="M 48 20 Q 20 -5 5 25 Q 30 15 48 20 Z" fill="url(#mountainMid)" />
          <path d="M 48 20 Q 50 -15 75 5 Q 60 15 48 20 Z" fill="url(#mountainMid)" />
          <path d="M 48 20 Q 80 15 95 40 Q 65 30 48 20 Z" fill="url(#mountainMid)" />
          <path d="M 48 20 Q 20 30 15 55 Q 35 35 48 20 Z" fill="url(#mountainMid)" />
          <path d="M 48 20 Q 30 50 25 70 Q 40 45 48 20 Z" fill="url(#mountainMid)" />
          <path d="M 48 20 Q 60 40 85 60 Q 55 40 48 20 Z" fill="url(#mountainMid)" />
          
          {/* Smaller Tree */}
          <g transform="translate(-18, 30) scale(0.85)">
            <path d="M 42 100 Q 30 60 48 20 Q 52 50 48 100 Z" fill="url(#mountainFront)" />
            <path d="M 48 20 Q 20 -5 5 25 Q 30 15 48 20 Z" fill="url(#mountainMid)" />
            <path d="M 48 20 Q 50 -15 75 5 Q 60 15 48 20 Z" fill="url(#mountainMid)" />
            <path d="M 48 20 Q 80 15 95 40 Q 65 30 48 20 Z" fill="url(#mountainMid)" />
            <path d="M 48 20 Q 20 30 15 55 Q 35 35 48 20 Z" fill="url(#mountainMid)" />
          </g>
        </g>

        {/* 3D Platinum Airplane */}
        <g transform="translate(65, -25) scale(0.7) rotate(20)" filter="url(#shadow3D)">
          <path 
            d="M 68.6 15.2 C 73.1 12.3 77.2 16.4 74.3 20.9 L 55.4 45.1 L 52.8 68.2 L 46.5 68.2 L 48.7 48.4 L 28.5 61.3 L 24.1 68.2 L 19.3 68.2 L 25.8 56.4 L 9.3 62.1 L 4.1 56.4 L 33.8 40.2 L 68.6 15.2 Z" 
            fill="url(#plane3D)" 
          />
          {/* Airplane Highlight Edge */}
          <path 
            d="M 68.6 15.2 C 73.1 12.3 77.2 16.4 74.3 20.9 L 55.4 45.1 L 48.7 48.4 L 33.8 40.2 Z" 
            fill="#FFFFFF" opacity="0.6"
          />
        </g>

        {/* 3D Gold Ribbon Base */}
        <path d="M -10 100 Q 70 85 150 100" stroke="url(#gold3D)" strokeWidth="4.5" fill="none" strokeLinecap="round" filter="url(#shadowLight)" />
        <path d="M 10 108 Q 70 95 130 108" stroke="url(#gold3D)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
      </g>

      {/* Exquisite 3D Typography */}
      <g transform="translate(180, 0)">
        {/* Deep drop shadow for the white text to guarantee absolute readability */}
        <text
          x="2"
          y="77"
          fontFamily="Montserrat, 'Inter', system-ui, -apple-system, sans-serif"
          fontSize="38"
          fontWeight="900"
          letterSpacing="1"
          fill="#000000"
          opacity="0.4"
          filter="url(#shadowLight)"
        >
          KASHMIR CURATORS
        </text>
        {/* Main Brand Title: High-end Solid White */}
        <text
          x="0"
          y="75"
          fontFamily="Montserrat, 'Inter', system-ui, -apple-system, sans-serif"
          fontSize="38"
          fontWeight="900"
          letterSpacing="1"
          fill="#FFFFFF"
        >
          KASHMIR CURATORS
        </text>

        {/* Subtitle: Perfectly aligned and tracked gold accent */}
        <text
          x="4"
          y="104"
          fontFamily="Montserrat, 'Inter', system-ui, -apple-system, sans-serif"
          fontSize="13"
          fontWeight="800"
          letterSpacing="9"
          fill="url(#gold3D)"
          filter="url(#shadowLight)"
        >
          TRAVEL AGENCY
        </text>
      </g>
    </svg>
  );
}
