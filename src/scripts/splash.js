export function init() {
  const canvas = document.getElementById('splash-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let t = 0;

  const blobs = [
    {
      cx:0.10, cy:0.18,
      xf:[[0.28,0.0055,0.00],[0.10,0.0130,1.70],[0.03,0.0360,3.20]],
      yf:[[0.22,0.0042,0.80],[0.09,0.0108,2.60],[0.02,0.0295,0.50]],
      rf:[0.48, 0.07, 0.0085, 1.50],
      color:[255,131,65], alpha:0.55
    },
    {
      cx:0.88, cy:0.78,
      xf:[[0.26,0.0048,2.10],[0.09,0.0120,0.50],[0.03,0.0330,1.90]],
      yf:[[0.24,0.0038,3.40],[0.09,0.0095,1.10],[0.02,0.0260,4.80]],
      rf:[0.44, 0.08, 0.0070, 2.80],
      color:[255,72,18],  alpha:0.48
    },
    {
      cx:0.80, cy:0.22,
      xf:[[0.22,0.0062,4.20],[0.08,0.0155,2.80],[0.02,0.0410,0.30]],
      yf:[[0.20,0.0050,1.60],[0.08,0.0125,4.10],[0.02,0.0230,2.40]],
      rf:[0.40, 0.07, 0.0100, 0.70],
      color:[255,165,75], alpha:0.40
    },
  ];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function sines(terms, t) {
    return terms.reduce((s, [a,f,p]) => s + a * Math.sin(t * f + p), 0);
  }

  function blobPos(b, time) {
    return {
      x: (b.cx + sines(b.xf, time)) * canvas.width,
      y: (b.cy + sines(b.yf, time)) * canvas.height,
    };
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    const minDim = Math.min(w, h);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0d0805';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'screen';

    const TRAIL    = 7;
    const TRAIL_DT = 2.5;

    blobs.forEach(b => {
      const r = (b.rf[0] + b.rf[1] * Math.sin(t * b.rf[2] + b.rf[3])) * minDim;
      const [cr,cg,cb] = b.color;

      for (let i = TRAIL; i >= 0; i--) {
        const pt   = blobPos(b, t - i * TRAIL_DT);
        const prog = (TRAIL - i) / TRAIL;
        const ghostR     = r * (0.45 + 0.55 * prog);
        const ghostAlpha = b.alpha * prog * (i === 0 ? 0.15 : 1.0);

        let angle = 0, stretch = 1;
        if (i < TRAIL) {
          const next = blobPos(b, t - (i - 1) * TRAIL_DT);
          const vx = next.x - pt.x, vy = next.y - pt.y;
          const speed = Math.sqrt(vx*vx + vy*vy);
          angle   = Math.atan2(vy, vx);
          stretch = 1 + Math.min(speed * 1.2, 2.8);
        }

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(angle);
        ctx.scale(stretch, 1);

        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ghostR);
        g.addColorStop(0,    `rgba(${cr},${cg},${cb},${ghostAlpha.toFixed(3)})`);
        g.addColorStop(0.30, `rgba(${cr},${cg},${cb},${(ghostAlpha*0.55).toFixed(3)})`);
        g.addColorStop(0.60, `rgba(${cr},${cg},${cb},${(ghostAlpha*0.15).toFixed(3)})`);
        g.addColorStop(1,    `rgba(${cr},${cg},${cb},0)`);

        ctx.beginPath();
        ctx.arc(0, 0, ghostR, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.globalCompositeOperation = 'source-over';
    t += 0.18;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();

  document.getElementById('splash').addEventListener('click', function() {
    this.classList.add('splash-out');
    setTimeout(() => {
      this.style.display = 'none';
      document.documentElement.classList.remove('splash-open');
      document.dispatchEvent(new CustomEvent('splashClosed'));
    }, 580);
  });
}
