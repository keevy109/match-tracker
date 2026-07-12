export function init() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let _s = 0xAB1F4C2E;
  function rng() {
    _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5;
    return (_s >>> 0) / 0xFFFFFFFF;
  }

  const BOKEH = Array.from({length: 24}, () => ({
    nx: rng(), ny: rng() * 0.80,
    nr: rng() * 0.042 + 0.007,
    a:  rng() * 0.11 + 0.04,
    hue: 210 + rng() * 35,
    sat: 38 + rng() * 22,
  }));

  function glow(cx, cy, r, color) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function render() {
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const base = ctx.createLinearGradient(0, 0, W * 0.45, H);
    base.addColorStop(0,    '#080d17');
    base.addColorStop(0.55, '#060a0f');
    base.addColorStop(1,    '#040608');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    glow(W * 0.18, H * -0.05, W * 0.55, 'rgba(30, 65, 130, 0.22)');
    glow(W * 0.80, H *  0.12, W * 0.42, 'rgba(22, 50, 112, 0.16)');
    glow(W * 0.62, H * 1.08,  W * 0.68, 'rgba(105, 58, 8, 0.14)');

    ctx.beginPath();
    ctx.moveTo(W * 0.54, H);
    ctx.lineTo(W,        H * 0.22);
    ctx.lineTo(W,        H);
    ctx.closePath();
    const sg = ctx.createLinearGradient(W * 0.75, H * 0.45, W, H * 0.22);
    sg.addColorStop(0, 'rgba(11, 19, 34, 0.92)');
    sg.addColorStop(1, 'rgba(7,  12, 22, 0.98)');
    ctx.fillStyle = sg;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(W * 0.54, H);
    ctx.lineTo(W, H * 0.22);
    ctx.strokeStyle = 'rgba(42, 82, 155, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(W * 0.70, H);
    ctx.lineTo(W,        H * 0.50);
    ctx.lineTo(W,        H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(5, 9, 16, 0.94)';
    ctx.fill();

    BOKEH.forEach(pt => {
      const bx = pt.nx * W, by = pt.ny * H;
      const br = pt.nr * Math.min(W, H);
      const g  = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      const c  = `hsla(${pt.hue},${pt.sat}%,65%,`;
      g.addColorStop(0,    c + pt.a + ')');
      g.addColorStop(0.40, c + (pt.a * 0.22).toFixed(3) + ')');
      g.addColorStop(1,    c + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    });

    const vig = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H) * 0.74);
    vig.addColorStop(0.3, 'transparent');
    vig.addColorStop(1,   'rgba(2, 4, 8, 0.82)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  window.addEventListener('resize', render);
  render();
}
