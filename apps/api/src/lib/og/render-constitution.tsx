/**
 * ConstitutionCardOG -- Satori-compatible JSX for dynamic OG images.
 *
 * Renders a user's three-tradition constitution summary as a 1200x630 PNG.
 * Dark mode only (OG cards are always dark themed for visual consistency).
 * All elements use display:flex (Satori requirement).
 */

import type { ConstitutionOGProps } from './og-types.js';

/** Truncate summary to max characters at word boundary. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > max * 0.6) {
    return `${truncated.slice(0, lastSpace)}...`;
  }
  return `${truncated}...`;
}

interface TraditionBadgeProps {
  name: string;
  summary: string;
}

function TraditionBadge({ name, summary }: TraditionBadgeProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 24px',
        borderRadius: 12,
        border: '1px solid rgba(20, 184, 166, 0.4)',
        maxWidth: 320,
        flex: 1,
      }}
    >
      <span
        style={{
          fontFamily: 'DM Sans',
          fontWeight: 500,
          fontSize: 16,
          color: '#ffffff',
          display: 'flex',
        }}
      >
        {name}
      </span>
      {summary && (
        <span
          style={{
            fontFamily: 'DM Sans',
            fontWeight: 400,
            fontSize: 13,
            color: '#a0a0a0',
            textAlign: 'center',
            marginTop: 6,
            display: 'flex',
          }}
        >
          {truncate(summary, 80)}
        </span>
      )}
    </div>
  );
}

export function ConstitutionCardOG({ summary, traditionSummaries }: ConstitutionOGProps) {
  const displaySummary = truncate(summary, 150);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 1200,
        height: 630,
        backgroundImage: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
        position: 'relative',
      }}
    >
      {/* Teal radial glow overlay */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 1200,
          height: 630,
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(20, 184, 166, 0.08) 0%, transparent 60%)',
        }}
      >
        {/* Top section: summary text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 60px 20px 60px',
            flex: 1,
          }}
        >
          <span
            style={{
              fontFamily: 'Crimson Pro',
              fontWeight: 300,
              fontSize: 42,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.3,
              display: 'flex',
            }}
          >
            {displaySummary}
          </span>
        </div>

        {/* Middle section: tradition badges */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            padding: '20px 40px',
          }}
        >
          <TraditionBadge name="Ayurveda" summary={traditionSummaries.ayurveda} />
          <TraditionBadge name="TCM" summary={traditionSummaries.tcm} />
          <TraditionBadge name="Naturopathy" summary={traditionSummaries.naturopathy} />
        </div>

        {/* Bottom section: branding */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '0px 40px 30px 40px',
          }}
        >
          <span
            style={{
              fontFamily: 'DM Sans',
              fontWeight: 500,
              fontSize: 18,
              color: '#14b8a6',
              display: 'flex',
            }}
          >
            triveda.app
          </span>
          <span
            style={{
              fontFamily: 'DM Sans',
              fontWeight: 400,
              fontSize: 13,
              color: '#666666',
              display: 'flex',
            }}
          >
            three traditions, one body
          </span>
        </div>
      </div>
    </div>
  );
}
