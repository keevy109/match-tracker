<section class="ticker-feature" id="ticker">
  <div class="ticker-feature-inner">
    <div class="ticker-feature-text">
      <div class="eyebrow">Live-Ticker</div>
      <h2 class="section-title">Unser Spiel.<br>In Echtzeit.</h2>
      <p>
        Jedes Spiel kann in jedem Browser mitverfolgt werden – ohne App,
        ohne Account. Der Trainer trägt Tore, Wechsel und Kommentare
        live ein; alle sehen die Ereignisse sofort.
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn-primary" id="latestTickerLink" href="#spielplan">Live-Ticker öffnen</a>
      </div>
    </div>

    <!-- Vorschau des letzten Tickers (dunkles Feed-Embed) -->
    <div class="ticker-mockup">
      <div class="ticker-mockup-bar">
        <div class="mock-dot" style="background:#ff5f57"></div>
        <div class="mock-dot" style="background:#febc2e"></div>
        <div class="mock-dot" style="background:#28c840"></div>
        <span class="ticker-mockup-title" id="latestTickerTitle">Live-Ticker</span>
      </div>
      <iframe class="ticker-preview" id="latestTickerFrame" title="Vorschau des letzten Live-Tickers" loading="lazy" hidden></iframe>
      <div class="mock-no-live" id="latestTickerEmpty">Noch kein Ticker verfügbar.</div>
    </div>
  </div>
</section>
