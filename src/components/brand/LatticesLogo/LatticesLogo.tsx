import { cn } from '@lib/utils/cn';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LatticesLogoProps {
  size?: LogoSize;
  className?: string;
}

const sizeClasses: Record<LogoSize, string> = {
  xs: 'h-4 w-4', // 16px — inline mentions
  sm: 'h-5 w-5', // 20px — header
  md: 'h-8 w-8', // 32px — empty states, invitation
  lg: 'h-12 w-12', // 48px — auth pages
  xl: 'h-16 w-16', // 64px — splash/landing
};

/** Sizes that use the simplified M3 lattice (5 nodes) */
const simplifiedSizes = new Set<LogoSize>(['xs', 'sm']);

/**
 * M3 diamond lattice — 5 nodes, 6 edges, viewBox 0 0 32 32.
 * Used at xs/sm sizes for crisp rendering at small pixel counts.
 */
function M3Lattice() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
      {/* Edges: cover relations (6 edges) */}
      {/* Top fans down to 3 mid nodes */}
      <line x1="16" y1="5" x2="5" y2="16" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="5" x2="16" y2="16" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="5" x2="27" y2="16" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
      {/* 3 mid nodes fan down to bottom */}
      <line x1="5" y1="16" x2="16" y2="27" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
      <line
        x1="16"
        y1="16"
        x2="16"
        y2="27"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="27"
        y1="16"
        x2="16"
        y2="27"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Nodes (drawn on top of edges) */}
      <circle cx="16" cy="5" r="3" fill="#f59e0b" />
      <circle cx="5" cy="16" r="3" fill="#6366f1" />
      <circle cx="16" cy="16" r="3" fill="#6366f1" />
      <circle cx="27" cy="16" r="3" fill="#6366f1" />
      <circle cx="16" cy="27" r="3" fill="#22d3ee" />
    </svg>
  );
}

/**
 * B3 power set lattice — 8 nodes, 12 edges, viewBox 0 0 48 48.
 * Used at md/lg/xl sizes where there's room for the richer visual.
 */
function B3Lattice() {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
      {/* Edges: cover relations (12 edges) */}
      {/* Level 3 → Level 2: top fans down to 3 nodes */}
      <line x1="24" y1="6" x2="10" y2="18" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="6" x2="24" y2="18" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="6" x2="38" y2="18" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
      {/* Level 2 → Level 1: 6 edges with 2 natural crossings */}
      <line
        x1="10"
        y1="18"
        x2="10"
        y2="30"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="18"
        x2="24"
        y2="30"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="18"
        x2="10"
        y2="30"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="18"
        x2="38"
        y2="30"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="18"
        x2="24"
        y2="30"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="18"
        x2="38"
        y2="30"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Level 1 → Level 0: 3 singletons converge to bottom */}
      <line
        x1="10"
        y1="30"
        x2="24"
        y2="42"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="30"
        x2="24"
        y2="42"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="30"
        x2="24"
        y2="42"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Nodes (drawn on top of edges) */}
      <circle cx="24" cy="6" r="3.5" fill="#f59e0b" />
      <circle cx="10" cy="18" r="3.5" fill="#6366f1" />
      <circle cx="24" cy="18" r="3.5" fill="#6366f1" />
      <circle cx="38" cy="18" r="3.5" fill="#6366f1" />
      <circle cx="10" cy="30" r="3.5" fill="#818cf8" />
      <circle cx="24" cy="30" r="3.5" fill="#818cf8" />
      <circle cx="38" cy="30" r="3.5" fill="#818cf8" />
      <circle cx="24" cy="42" r="3.5" fill="#22d3ee" />
    </svg>
  );
}

export function LatticesLogo({ size = 'md', className }: LatticesLogoProps) {
  return (
    <span className={cn('inline-block', sizeClasses[size], className)}>
      {simplifiedSizes.has(size) ? <M3Lattice /> : <B3Lattice />}
    </span>
  );
}
