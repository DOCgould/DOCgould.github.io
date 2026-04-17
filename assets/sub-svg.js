// Inline SVG wireframe of a submarine/AUV, slowly spinning via CSS.
// Themed to echo the real FullHull.stl used in /flight/.

export function mountSubSvg(container) {
  container.innerHTML = `
    <svg class="sub-svg" viewBox="-60 -28 120 56" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AUV wireframe">
      <g class="sub-hull" fill="none" stroke="currentColor" stroke-width="0.6">
        <!-- main hull ellipse -->
        <ellipse cx="0" cy="0" rx="48" ry="10"/>
        <!-- longitudinal spine -->
        <line x1="-48" y1="0" x2="48" y2="0"/>
        <!-- cross-section rings -->
        <ellipse cx="-32" cy="0" rx="4" ry="9"/>
        <ellipse cx="-16" cy="0" rx="4.5" ry="10"/>
        <ellipse cx="0" cy="0" rx="4.5" ry="10"/>
        <ellipse cx="16" cy="0" rx="4" ry="9.5"/>
        <ellipse cx="30" cy="0" rx="3" ry="7"/>
        <!-- sail / tower -->
        <path d="M -6 -10 L -2 -18 L 6 -18 L 10 -10 Z"/>
        <line x1="2" y1="-18" x2="2" y2="-23"/>
        <circle cx="2" cy="-24" r="0.9"/>
        <!-- aft fin -->
        <path d="M 40 -3 L 52 -7 L 52 7 L 40 3 Z"/>
        <!-- forward fins -->
        <path d="M -38 -2 L -46 -5 L -46 5 L -38 2 Z"/>
        <!-- propeller hub -->
        <circle cx="50" cy="0" r="1.4"/>
        <line x1="48.6" y1="0" x2="54" y2="-4"/>
        <line x1="48.6" y1="0" x2="54" y2="4"/>
        <line x1="48.6" y1="0" x2="45" y2="0"/>
      </g>
    </svg>
    <div class="sub-caption">SDSU AUV &ldquo;Perseverance&rdquo; &mdash; telemetry viewer</div>
  `;
}
