import React from 'react';

export type AccountStatus = 'active' | 'pending_alert' | 'pending' | 'alert_triggered';

interface StatusIndicatorProps {
  status: AccountStatus;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showLabel?: boolean;
  showBadge?: boolean;
  className?: string;
}

export function getStatusConfig(status: AccountStatus) {
  const normalized = status === 'pending' ? 'pending_alert' : status;

  switch (normalized) {
    case 'active':
      return {
        key: 'active',
        name: 'Aktiv (Active)',
        shortName: 'Aktiv',
        description: 'Schutzsystem aktiv. Alles in bester Ordnung.',
        dotColor: 'bg-emerald-500',
        pingColor: 'bg-emerald-400',
        glowClass: 'shadow-[0_0_16px_rgba(16,185,129,0.7)] ring-4 ring-emerald-500/25',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        cardBg: 'bg-emerald-50/50 border-emerald-200',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-500',
        iconName: 'check',
      };
    case 'pending_alert':
      return {
        key: 'pending_alert',
        name: 'Ausstehend (Pending)',
        shortName: 'Ausstehend',
        description: 'Wöchentlicher Check-in überfällig. 24h Frist aktiv!',
        dotColor: 'bg-amber-500',
        pingColor: 'bg-amber-400',
        glowClass: 'shadow-[0_0_18px_rgba(245,158,11,0.8)] ring-4 ring-amber-500/30',
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
        cardBg: 'bg-amber-50/70 border-amber-300',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-500',
        iconName: 'clock',
      };
    case 'alert_triggered':
      return {
        key: 'alert_triggered',
        name: 'Notfall Ausgelöst (Emergency Triggered)',
        shortName: 'Notfall',
        description: 'Notfall-Alarm ist aktiv. Kontakte & Daten freigegeben!',
        dotColor: 'bg-[#E63946]',
        pingColor: 'bg-[#9A031E]',
        glowClass: 'shadow-[0_0_24px_rgba(230,57,70,0.9)] ring-4 ring-[#E63946]/40',
        badgeBg: 'bg-rose-50 text-[#9A031E] border-rose-200',
        cardBg: 'bg-rose-50/80 border-rose-200',
        textColor: 'text-[#E63946]',
        borderColor: 'border-[#E63946]',
        iconName: 'alert',
      };
    default:
      return {
        key: 'active',
        name: 'Aktiv',
        shortName: 'Aktiv',
        description: 'Schutzsystem aktiv.',
        dotColor: 'bg-slate-400',
        pingColor: 'bg-slate-300',
        glowClass: 'shadow-none ring-2 ring-slate-200',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        cardBg: 'bg-slate-50 border-slate-200',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-300',
        iconName: 'check',
      };
  }
}

export default function StatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  showBadge = false,
  className = '',
}: StatusIndicatorProps) {
  const config = getStatusConfig(status);

  // Size configurations
  const sizeMap = {
    sm: {
      dot: 'w-2.5 h-2.5',
      ping: 'w-2.5 h-2.5',
      text: 'text-xs',
      badge: 'px-2 py-0.5 text-xs',
    },
    md: {
      dot: 'w-3.5 h-3.5',
      ping: 'w-3.5 h-3.5',
      text: 'text-sm font-semibold',
      badge: 'px-2.5 py-1 text-xs font-semibold',
    },
    lg: {
      dot: 'w-5 h-5',
      ping: 'w-5 h-5',
      text: 'text-base font-bold',
      badge: 'px-3.5 py-1.5 text-sm font-bold',
    },
    hero: {
      dot: 'w-7 h-7',
      ping: 'w-7 h-7',
      text: 'text-lg font-bold',
      badge: 'px-4 py-2 text-sm font-bold tracking-wide uppercase',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Visual Color-Coded Status Light with glowing beacon effect */}
      <div className="relative flex items-center justify-center">
        {/* Animated radar/ping pulse */}
        <span
          className={`absolute inline-flex ${currentSize.ping} rounded-full ${config.pingColor} opacity-75 animate-ping`}
        />
        {/* Glowing halo & solid LED core with specular dot */}
        <span
          className={`relative inline-flex ${currentSize.dot} rounded-full ${config.dotColor} ${config.glowClass} transition-colors duration-500`}
        >
          {/* Subtle light reflection highlight */}
          <span className="absolute top-[15%] left-[20%] w-[35%] h-[35%] rounded-full bg-white/70" />
        </span>
      </div>

      {/* Optional Badge */}
      {showBadge && (
        <span
          className={`inline-flex items-center border rounded-full font-medium transition-all ${currentSize.badge} ${config.badgeBg}`}
        >
          {config.name}
        </span>
      )}

      {/* Optional Plain Text Label */}
      {showLabel && !showBadge && (
        <span className={`${currentSize.text} ${config.textColor}`}>
          {config.name}
        </span>
      )}
    </div>
  );
}
