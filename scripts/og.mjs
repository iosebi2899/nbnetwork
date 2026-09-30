// Generates public/og.png (1200x630) for social sharing. Run: npm run og
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g1" cx="85%" cy="10%" r="70%"><stop offset="0" stop-color="#b026c9" stop-opacity=".35"/><stop offset="1" stop-color="#b026c9" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0%" cy="100%" r="60%"><stop offset="0" stop-color="#466eff" stop-opacity=".22"/><stop offset="1" stop-color="#466eff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#141a3a"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <g transform="translate(80 80) scale(3.2)">
    <rect width="38" height="38" rx="11" fill="#1d2552"/>
    <path d="M11 17 A10 10 0 0 1 21 27" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M11 9 A18 18 0 0 1 29 27" fill="none" stroke="#b026c9" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="12" cy="26" r="3.2" fill="#e58cf5"/>
  </g>
  <text x="80" y="360" font-family="Arial, sans-serif" font-size="96" fill="#fff" letter-spacing="-2"><tspan font-weight="700">nb</tspan><tspan fill="#c9cde4">networks</tspan></text>
  <text x="80" y="440" font-family="Arial, sans-serif" font-size="36" fill="#e58cf5">WI-FI · Optic · Satellite · 24/7</text>
  <text x="80" y="540" font-family="Arial, sans-serif" font-size="32" fill="#c9cde4">NB Networks · ☎ 599-298-456</text>
  <text x="1120" y="160" text-anchor="end" font-family="Arial, sans-serif" font-size="120" font-weight="700" fill="#fff">50<tspan font-size="40" fill="#c9cde4"> Mbps</tspan></text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('public/og.png written');
