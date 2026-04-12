/**
 * DefaultOG -- static fallback OG image component.
 *
 * Used when a constitution ID is invalid or missing.
 * Generic Triveda branding with the tagline.
 */

export function DefaultOG() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 1200,
        height: 630,
        backgroundImage: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* App name */}
      <span
        style={{
          fontFamily: 'Crimson Pro',
          fontWeight: 300,
          fontSize: 64,
          color: '#ffffff',
          display: 'flex',
        }}
      >
        Triveda
      </span>

      {/* Three teal dots separator */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 12,
          margin: '24px 0',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#14b8a6',
            display: 'flex',
          }}
        />
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#14b8a6',
            display: 'flex',
          }}
        />
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#14b8a6',
            display: 'flex',
          }}
        />
      </div>

      {/* Tagline */}
      <span
        style={{
          fontFamily: 'DM Sans',
          fontWeight: 400,
          fontSize: 24,
          color: '#a0a0a0',
          display: 'flex',
        }}
      >
        three traditions, one body
      </span>
    </div>
  );
}
