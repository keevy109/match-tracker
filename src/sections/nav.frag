<nav class="nav">
  <div class="nav-inner">
    <a class="nav-brand" href="index.html">
      <div class="nav-crest"><img src="/ssvlogo_white.png" alt="SSV Berghausen"></div>
    </a>
    <div class="nav-links">
      <a class="nav-link" href="#spielplan">Spielplan</a>
      <a class="nav-link" href="#kader">Kader</a>
      <a class="nav-link" href="#aktuelles">Aktuelles</a>
      <a class="nav-link highlight" id="navTickerLink" href="#ticker">Live-Ticker →</a>
      <button class="nav-theme" onclick="toggleTheme()" title="Farbschema wechseln">◐</button>
    </div>
  </div>
  <!-- Kompakter Spielstand des letzten Tickers -->
  <div class="nav-score" id="navScore" hidden>
    <iframe class="nav-score-frame" id="navScoreFrame" title="Aktueller Spielstand"></iframe>
  </div>
</nav>
