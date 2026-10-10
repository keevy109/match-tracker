(function(root) {
  function start(required) {
    const pending = new Set(required);
    const overlay = document.createElement('div');
    overlay.className = 'ticker-loading-overlay';
    overlay.setAttribute('role', 'status');
    overlay.innerHTML = `<svg class="tactics-loader" viewBox="60 25 450 510" aria-hidden="true">
      <defs><mask id="tactics-route-reveal" maskUnits="userSpaceOnUse" x="60" y="25" width="450" height="510">
        <path class="tactics-route-reveal" pathLength="1" d="M399 246 C412 129 333 128 266 180 S143 276 116 215 Q93 179 109 110" fill="none" stroke="white" stroke-width="26"/>
      </mask></defs>
      <g class="tactics-marks">
        <path d="M90 54 L125 76 M119 50 L97 82 M448 282 L493 298 M482 273 L463 317 M88 472 L149 495 M126 457 L100 516"/>
        <path d="M159 145 C132 151 137 184 155 189 C174 196 200 174 193 156 C186 138 174 141 159 145 Z M316 200 C291 199 280 220 296 239 C311 254 337 241 341 223 C343 214 336 203 328 200 M223 315 C196 315 185 345 208 365 C231 386 266 364 261 340 C256 319 240 310 223 315 Z M395 375 C370 376 365 403 388 420 C409 435 437 413 429 391 C424 377 407 369 395 375 Z"/>
      </g>
      <path class="tactics-pass" pathLength="1" d="M173 458 Q231 420 288 391 T421 321"/>
      <path class="tactics-pass-arrow" d="M392 315 Q409 318 426 316 L415 342"/>
      <path class="tactics-route" mask="url(#tactics-route-reveal)" d="M399 246 C412 129 333 128 266 180 S143 276 116 215 Q93 179 109 110"/>
      <path class="tactics-route-arrow" d="M90 130 L110 104 L127 126"/>
    </svg><span>Spiel wird geladen …</span><button hidden>Erneut laden</button>`;
    overlay.querySelector('button').onclick = () => location.reload();
    document.body.appendChild(overlay);
    document.body.classList.add('ticker-loading');
    let finished = false, revealing = false;
    const timeout = setTimeout(() => fail('Das Laden dauert länger. Bitte Verbindung prüfen.'), 15000);
    function fail(message = 'Der Ticker konnte nicht vollständig geladen werden.') {
      if (finished) return;
      overlay.querySelector('span').textContent = message;
      overlay.querySelector('button').hidden = false;
    }
    async function ready(key) {
      pending.delete(key);
      if (pending.size || finished || revealing) return;
      revealing = true;
      // Decode crests before revealing their final layout; failed assets cannot
      // leave the ticker blocked indefinitely.
      await Promise.all(Array.from(document.querySelectorAll('.feed-result-logo, .club-site nav img')).map(img =>
        !img.getAttribute('src') ? Promise.resolve() : Promise.race([
          img.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 5000))
        ])));
      finished = true; clearTimeout(timeout);
      document.body.classList.remove('ticker-loading');
      document.body.classList.add('ticker-loaded');
      overlay.remove();
    }
    return {ready, fail};
  }
  root.MatchTrackerLoader = {start};
})(globalThis);
