import React from 'react';

interface VivoPingLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
  subtitle?: string;
}

export default function VivoPingLogo({
  size = 'md',
  showText = true,
  className = '',
  variant = 'light',
  subtitle
}: VivoPingLogoProps) {
  // Size mappings
  const imgSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl',
  };

  const textColor = variant === 'dark' ? 'text-white' : 'text-[#2B2D42]';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official App Logo */}
      <div className={`relative shrink-0 flex items-center justify-center ${imgSizes[size]}`}>
        <img
          src="/assets/aistudio/Logo_Lifeguard_App_d32e2a0e.png"
          alt="LifeGuard / VivoPing"
          className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(154,3,30,0.22)] transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            // Fallback to root logo if path issue
            const target = e.target as HTMLImageElement;
            if (target.src.indexOf('/vivoping-logo.png') === -1) {
              target.src = '/vivoping-logo.png';
            }
          }}
        />
      </div>

      {/* Typography: "Vivo" in Montserrat SemiBold (600), "Ping" in Crimson / Red (600) */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-heading tracking-tight leading-none ${textSizes[size]} ${textColor}`}>
            <span className="font-semibold" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
              Vivo
            </span>
            <span className="font-semibold text-[#9A031E]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
              Ping
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
