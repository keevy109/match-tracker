let trainingSessions = {};
let trainingLoaded = false;
let trainingSaving = false;
let trainingEditor = 0;
function trainingToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
async function loadTraining() {
  try {
    trainingSessions = (await readStoredValue(firebase.database().ref('trainingSessions'))).val() || {};
    localStorage.setItem('mt_training_sessions', JSON.stringify(trainingSessions));
    trainingLoaded = true;
  } catch(e) {
    try { trainingSessions = JSON.parse(localStorage.getItem('mt_training_sessions') || '{}'); } catch(_) {}
    trainingLoaded = false;
  }
  renderTraining();
}
function renderTraining() {
  const list = document.getElementById('trainingList');
  if (!list) return;
  const date = document.getElementById('trainingDate');
  if (!date.value) date.value = trainingToday();
  date.max = trainingToday();
  const sessions = Object.entries(trainingSessions).sort((a,b)=>b[0].localeCompare(a[0]));
  list.innerHTML = (!trainingLoaded ? '<p>Verbindung prüfen: angezeigte Einheiten können veraltet sein. <button class="btn-export" onclick="loadTraining()">Erneut laden</button></p>' : '') +
    (sessions.length ? sessions.map(([id,s]) => `<div class="spielplan-item"><div class="spielplan-teams">${esc(new Date(s.date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}))}</div><div class="spielplan-meta">${s.cancelled ? 'Ausgefallen – zählt nicht zur Beteiligung' : `${Object.values(s.playerIds || []).length} Spieler anwesend`}</div><button class="btn-row-edit" onclick="editTraining('${esc(id)}')">Anwesenheit bearbeiten</button></div>`).join('') : '<div class="spielplan-empty">Noch keine Trainingseinheiten erfasst.</div>');
}
function editTraining(id = document.getElementById('trainingDate').value) {
  if (new URLSearchParams(window.location.search).has('ticker')) return;
  if (!trainingLoaded) { showToast('Bitte zuerst die Trainingseinheiten laden.'); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(id) || id > trainingToday() || Number.isNaN(new Date(id+'T12:00:00').getTime())) { showToast('Bitte ein gültiges Datum bis heute auswählen.'); return; }
  const existing = trainingSessions[id];
  let draft;
  try { draft = JSON.parse(localStorage.getItem('mt_training_draft_'+id) || 'null'); } catch(_) {}
  const selected = new Set(Object.values(draft?.playerIds || existing?.playerIds || []).map(String));
  const generation = ++trainingEditor;
  openEditSheet('Training · '+new Date(id+'T12:00:00').toLocaleDateString('de-DE'), `<label>Status<select id="trainingCancelled"><option value="no">Durchgeführt</option><option value="yes" ${(draft?.cancelled ?? existing?.cancelled) ? 'selected' : ''}>Ausgefallen</option></select></label><p>Wer war tatsächlich beim Training? Zusagen allein zählen nicht. Ausgefallene Einheiten werden nicht gewertet.</p><div class="export-row"><button class="btn-export" type="button" onclick="document.querySelectorAll('.training-player').forEach(el=>el.checked=true)">Alle auswählen</button><button class="btn-export" type="button" onclick="document.querySelectorAll('.training-player').forEach(el=>el.checked=false)">Auswahl leeren</button></div>${squad.map(p=>`<label style="flex-direction:row;align-items:center;gap:10px"><input class="training-player" type="checkbox" value="${p.id}" style="width:20px;height:20px;flex-shrink:0;padding:0" ${selected.has(String(p.id))?'checked':''}>${p.photo?`<img src="${esc(p.photo)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover">`:''}${esc(p.name)}</label>`).join('')}<p id="trainingSaveStatus" role="status">${draft?'Nicht gespeicherte Auswahl wiederhergestellt.':''}</p>`, async () => {
    if (trainingSaving) return;
    const status = document.getElementById('trainingSaveStatus');
    const cancelled = document.getElementById('trainingCancelled').value === 'yes';
    const playerIds = Array.from(document.querySelectorAll('.training-player:checked'),el=>Number(el.value));
    const data = {date:id, cancelled, playerIds, eligiblePlayerIds:[...new Set([...Object.values(existing?.eligiblePlayerIds || squad.map(p=>p.id)), ...playerIds])], revision:crypto.randomUUID(), updatedAt:Date.now()};
    trainingSaving = true;
    try {
      localStorage.setItem('mt_training_draft_'+id, JSON.stringify(data));
      status.textContent = 'Anwesenheit wird gespeichert …';
      const ref = firebase.database().ref('trainingSessions/'+id);
      if (existing) await withStorageTimeout(firebase.database().ref('trainingHistory/'+id+'/'+data.revision).set(existing));
      const result = await withStorageTimeout(ref.transaction(current => {
        if ((current?.revision || null) !== (existing?.revision || null)) return;
        return data;
      }, undefined, false));
      if (!result.committed) throw new Error('Diese Einheit wurde inzwischen geändert. Bitte Training neu laden und die Auswahl prüfen.');
      trainingSessions[id] = data;
      localStorage.setItem('mt_training_sessions', JSON.stringify(trainingSessions));
      localStorage.removeItem('mt_training_draft_'+id);
      renderTraining(); renderKaderList(); save();
      if (generation === trainingEditor) document.getElementById('editSheet').classList.remove('active');
      showToast('Training und Beteiligung gespeichert.');
    } catch(e) { if (generation === trainingEditor) status.textContent = 'Speichern nicht bestätigt. Auswahl bleibt als Entwurf auf diesem Gerät. ' + (e.message || 'Bitte erneut versuchen.'); }
    finally { trainingSaving = false; }
  });
}
