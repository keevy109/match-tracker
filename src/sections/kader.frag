<section class="section" id="kader">
  <div class="container">
    <div class="eyebrow">Die Mannschaft</div>
    <h2 class="section-title">Kader <span id="kaderCount" class="placeholder-badge">–</span></h2>
    <div class="kader-layout">

      <!-- Linke Spalte: Spielerliste + Trainerteam -->
      <div class="kader-list">
        <div id="kaderRows"></div>
        <div class="kader-staff" id="trainerSection" style="display:none">
          <div class="kader-staff-label">Trainerteam</div>
          <div id="trainerRows"></div>
        </div>
      </div>

      <!-- Rechte Spalte: Detail-Panel -->
      <div class="kader-detail" id="kaderDetail">
        <img id="kdBg" class="kd-bg-img" src="" alt="">
        <div class="kd-bg-overlay"></div>
        <div class="kd-inner">
          <!-- Club-Logo oben links -->
          <img src="/ssvlogo_white.png" alt="SSV" class="kd-clogo">
          <!-- Bewertung + Name -->
          <div class="kd-head">
            <div class="kd-rating-col">
              <span class="kd-rating" id="kdRating">–</span>
              <span class="kd-ges" id="kdGes">–</span>
            </div>
            <div class="kd-namecol">
              <span class="kd-fn" id="kdFN">–</span>
              <span class="kd-ln" id="kdLN">–</span>
            </div>
          </div>
          <hr class="kd-sep">
          <!-- Spieler-Stats -->
          <div class="kd-phys">
            <div class="kd-stat"><span class="kd-pv" id="kdGoals">–</span><span class="kd-pl">TORE</span></div>
            <div class="kd-stat"><span class="kd-pv" id="kdAssists">–</span><span class="kd-pl">VORLAGEN</span></div>
            <div class="kd-stat"><span class="kd-pv" id="kdGames">–</span><span class="kd-pl">SPIELE</span></div>
            <div class="kd-stat"><span class="kd-pv" id="kdTraining">–</span><span class="kd-pl">TRAINING</span></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
