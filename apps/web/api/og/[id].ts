/**
 * Vercel Serverless Function for social crawler OG tag injection.
 *
 * Path: /api/og/:id (maps to /c/:id via vercel.json rewrites)
 *
 * Detects social media crawlers via User-Agent and returns HTML with
 * OG meta tags. Human visitors are redirected to the SPA with a bypass flag.
 *
 * Per amendment 002: this is a Serverless Function, NOT Edge Middleware.
 * Vite static deploys on Vercel do not support middleware.ts.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Crawler detection
// ---------------------------------------------------------------------------

const CRAWLER_UA_PATTERNS = [
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'whatsapp',
  'discordbot',
  'telegrambot',
  'googlebot',
  'bingbot',
  'applebot',
];

export function isCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_UA_PATTERNS.some((pattern) => ua.includes(pattern));
}

// ---------------------------------------------------------------------------
// Summary truncation
// ---------------------------------------------------------------------------

export function truncateSummary(summary: string | null | undefined, maxLength = 60): string {
  if (!summary || summary.trim().length === 0) return 'Triveda Constitution';
  if (summary.length <= maxLength) return summary;
  const truncated = summary.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.6) {
    return `${truncated.slice(0, lastSpace)}...`;
  }
  return `${truncated}...`;
}

// ---------------------------------------------------------------------------
// HTML templates
// ---------------------------------------------------------------------------

function dynamicHtml(id: string, summary: string, apiUrl: string): string {
  const title = truncateSummary(summary);
  const ogImageUrl = `${apiUrl}/api/og/constitution/${id}`;
  const canonicalUrl = `https://triveda.vercel.app/c/${id}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} - Triveda</title>
  <meta property="og:title" content="${escapeAttr(title)}" />
  <meta property="og:description" content="A three-tradition constitutional profile on Triveda" />
  <meta property="og:image" content="${escapeAttr(ogImageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeAttr(canonicalUrl)}" />
  <meta property="og:type" content="profile" />
  <meta property="og:site_name" content="Triveda" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeAttr(title)}" />
  <meta name="twitter:description" content="A three-tradition constitutional profile on Triveda" />
  <meta name="twitter:image" content="${escapeAttr(ogImageUrl)}" />
  <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />
  <meta name="theme-color" content="#14b8a6" />
</head>
<body>
  <p>${escapeHtml(summary || 'Discover your unique constitution through three ancient wellness traditions.')}</p>
</body>
</html>`;
}

function defaultHtml(apiUrl: string): string {
  const ogImageUrl = `${apiUrl}/api/og/default`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Triveda - three traditions, one body</title>
  <meta property="og:title" content="Triveda" />
  <meta property="og:description" content="Discover your unique constitution through three ancient wellness traditions" />
  <meta property="og:image" content="${escapeAttr(ogImageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://triveda.vercel.app" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Triveda" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Triveda" />
  <meta name="twitter:description" content="Discover your unique constitution through three ancient wellness traditions" />
  <meta name="twitter:image" content="${escapeAttr(ogImageUrl)}" />
  <meta name="theme-color" content="#14b8a6" />
</head>
<body>
  <p>Discover your unique constitution through three ancient wellness traditions.</p>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const constitutionId = Array.isArray(id) ? id[0] : id;

  if (!constitutionId) {
    res.redirect(302, '/');
    return;
  }

  const ua = req.headers['user-agent'] || '';

  // Human visitor: redirect to SPA with bypass flag
  if (!isCrawler(ua)) {
    res.redirect(302, `/c/${constitutionId}?_bypass=1`);
    return;
  }

  // Crawler: fetch metadata from API and return HTML with OG tags
  const apiUrl = process.env.API_URL || 'https://triveda-api.onrender.com';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const metaRes = await fetch(`${apiUrl}/api/v1/constitution/${constitutionId}/meta`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (metaRes.ok) {
      const meta = (await metaRes.json()) as { summary?: string };
      const html = dynamicHtml(constitutionId, meta.summary || '', apiUrl);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.status(200).send(html);
      return;
    }
  } catch {
    // Fetch failed or timed out -- fall through to default
  }

  // Default fallback
  const html = defaultHtml(apiUrl);
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
