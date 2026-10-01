import React from 'react';

// Official Leaf Village (Konoha) spiral insignia
export const KonohaLeafIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="currentColor" 
      className={className}
      aria-hidden="true"
    >
      {/* Authentic Konoha Leaf Crest Shape */}
      <path 
        d="M 50 15 
           C 65 15, 82 28, 82 48 
           C 82 70, 64 85, 46 85 
           C 30 85, 18 72, 18 55 
           C 18 40, 28 28, 42 25 
           C 56 22, 68 32, 68 46 
           C 68 58, 58 66, 48 66 
           C 38 66, 32 58, 35 50 
           C 37 44, 43 40, 48 41 
           C 52 42, 54 46, 53 49 
           C 52 51, 50 52, 48 52 
           C 44 52, 44 47, 47 46 
           C 45 44, 41 46, 40 50 
           C 38 56, 44 61, 50 61 
           C 57 61, 63 54, 63 46 
           C 63 35, 53 27, 42 29 
           C 31 31, 23 42, 23 54 
           C 23 68, 33 80, 46 80 
           C 60 80, 76 67, 76 48 
           C 76 32, 62 20, 50 20 
           L 50 15 Z" 
      />
      {/* Leaf stem pointer at top-right */}
      <path 
        d="M 50 15 
           C 62 10, 78 12, 90 22 
           C 82 26, 75 25, 68 22 
           Z" 
      />
    </svg>
  );
};

// Official Disciplinary Seal Stamp (Vermilion Wax / Ink Seal)
export const DisciplinarySealStamp: React.FC<{ 
  size?: 'sm' | 'md' | 'lg'; 
  label?: string;
  sublabel?: string;
  className?: string;
}> = ({ 
  size = 'md', 
  label = 'BUREAU DISCIPLINAIRE',
  sublabel = 'ACADÉMIE DE KONOHA',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24 text-[8px]',
    md: 'w-36 h-36 text-[10px]',
    lg: 'w-48 h-48 text-[12px]'
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-full border-2 border-red-600/80 text-red-500 font-cinzel select-none p-1 shadow-inner shadow-red-950/40 rotate-[-4deg] ${sizeClasses[size]} ${className}`}
      style={{
        background: 'radial-gradient(circle, rgba(185, 28, 28, 0.08) 0%, rgba(153, 27, 27, 0.03) 70%, transparent 100%)'
      }}
    >
      {/* Inner dashed ring */}
      <div className="absolute inset-1.5 rounded-full border border-dashed border-red-600/60 pointer-events-none" />
      
      {/* Center content */}
      <div className="text-center flex flex-col items-center justify-center z-10 px-2">
        <KonohaLeafIcon className="w-5 h-5 text-red-600/90 mb-1" />
        <span className="font-bold tracking-widest leading-tight text-red-400 uppercase text-center">
          {label}
        </span>
        <span className="text-[7px] text-red-500/80 tracking-wider mt-0.5 font-mono uppercase">
          {sublabel}
        </span>
        <div className="w-8 h-px bg-red-600/60 my-0.5" />
        <span className="text-[6px] tracking-widest text-red-600/70 font-mono">
          木ノ葉・規律印
        </span>
      </div>
    </div>
  );
};

// Discord Brand Logo SVG
export const DiscordIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg 
      viewBox="0 0 127.14 96.36" 
      fill="currentColor" 
      className={className}
      aria-hidden="true"
    >
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-19.11-72.26ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
    </svg>
  );
};

// Google Official Brand Multi-Color "G" Icon
export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
};

// Gmail Envelope Icon
export const GmailIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 6C2 4.89543 2.89543 4 4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6Z"
        fill="#1F2937"
        stroke="#EF4444"
        strokeWidth="1.5"
      />
      <path
        d="M2 6L12 13L22 6"
        stroke="#EF4444"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 18L9 12"
        stroke="#DC2626"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22 18L15 12"
        stroke="#DC2626"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const FuinjutsuKekkaiSeal: React.FC<{ className?: string }> = ({ className = 'w-32 h-32' }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      stroke="currentColor" 
      className={className}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="92" strokeWidth="2" strokeDasharray="4 4" className="text-red-600/40 animate-[spin_60s_linear_infinite]" />
      <circle cx="100" cy="100" r="82" strokeWidth="1.5" className="text-red-500/70" />
      <circle cx="100" cy="100" r="68" strokeWidth="1" strokeDasharray="6 3" className="text-red-400/50 animate-[spin_40s_linear_infinite_reverse]" />
      
      {/* Hexagram / Octagram lines of barrier */}
      <polygon points="100,28 162,136 38,136" strokeWidth="1" className="text-red-500/60" />
      <polygon points="100,172 162,64 38,64" strokeWidth="1" className="text-red-500/60" />
      
      {/* Central Shinobi Leaf core */}
      <circle cx="100" cy="100" r="28" fill="rgba(185, 28, 28, 0.2)" strokeWidth="1.5" className="text-red-500" />
      <path 
        d="M 100 85 C 108 85, 115 91, 115 100 C 115 109, 107 115, 98 115 C 92 115, 87 110, 87 104 C 87 98, 91 95, 96 95 C 100 95, 102 98, 101 100 C 100 102, 98 102, 96 102" 
        fill="currentColor" 
        className="text-red-400"
      />
    </svg>
  );
};
