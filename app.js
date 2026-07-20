// Simple SAT routine generator prototype

const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

const form = qs('#profileForm');
const routineEl = qs('#routine');
const loadBtn = qs('#loadBtn');
const clearBtn = qs('#clearBtn');

function daysBetween(d1, d2) {
  const oneDay = 24*60*60*1000;
  return Math.ceil((d2 - d1) / oneDay);
}

function getFormData() {
  return {
    name: qs('#name').value.trim(),
    current: Number(qs('#currentScore').value),
    target: Number(qs('#targetScore').value),
    testDate: qs('#testDate').value ? new Date(qs('#testDate').value) : null,
    focusMath: qs('#focusMath').checked,
    focusReading: qs('#focusReading').checked,
    focusWriting: qs('#focusWriting').checked,
    hoursPerDay: Number(qs('#hoursPerDay').value) || 0,
    mathTopics: qsa('.math-topic:checked').map(i => i.value),
    readingTopics: qsa('.reading-topic:checked').map(i => i.value),
    writingTopics: qsa('.writing-topic:checked').map(i => i.value)
  };
}

function computeRoutine(data) {
  const today = new Date();
  let daysLeft = 90; // default plan length
  if (data.testDate) {
    daysLeft = daysBetween(today, data.testDate);
    if (daysLeft < 14) daysLeft = 14; // minimum window
  }
  const improvement = Math.max(0, data.target - data.current);
  const suggestedMinutes = Math.max(15, Math.round(data.hoursPerDay * 60));

  // Estimate effort to reach target: minutes-per-point (heuristic)
  const minutesPerPoint = 30; // ~30 minutes of focused practice per SAT point (heuristic)
  const totalRequiredMinutes = improvement * minutesPerPoint;
  const dailyNeeded = Math.ceil(totalRequiredMinutes / Math.max(1, daysLeft));

  // Intensity scale: if dailyNeeded > available, flag higher intensity
  const intensityRatio = dailyNeeded / Math.max(1, suggestedMinutes);

  // Topic weights: prefer user-selected focus, otherwise balanced
  let mathW = data.focusMath ? 0.5 : 0.4;
  let readingW = data.focusReading ? 0.3 : 0.35;
  let writingW = 1 - mathW - readingW;
  if (writingW < 0.1) writingW = 0.1;
  // Bias weights by number of weak subtopics marked
  const mathBias = (data.mathTopics || []).length * 0.04;
  const readingBias = (data.readingTopics || []).length * 0.035;
  const writingBias = (data.writingTopics || []).length * 0.03;
  mathW += mathBias; readingW += readingBias; writingW += writingBias;
  // Normalize
  const sumW = mathW + readingW + writingW;
  mathW /= sumW; readingW /= sumW; writingW /= sumW;

  // Progressive plan: 7-day cycle with progressive overload over the weeks
  const weekNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const baseDaily = suggestedMinutes;
  const plan = weekNames.map((day, i) => {
    // Bump intensity slightly on mid-week and weekend practice
    const bump = (i === 2 || i === 5) ? 1.15 : 1.0; // Wed and Sat heavier
    // Add a small review slot each day (spaced repetition)
    const reviewM = Math.max(8, Math.round(baseDaily * 0.12));

    // Allocate core practice minutes across topics
    const core = Math.round(baseDaily * bump) - reviewM;
    const mathM = Math.max(8, Math.round(core * mathW));
    const readingM = Math.max(6, Math.round(core * readingW));
    const writingM = Math.max(6, core - mathM - readingM);

    // Mini maintenance or focused drills
    const drills = [];
    if (mathM > 0) drills.push({title: 'Math practice', minutes: mathM, tag: 'math'});
    if (readingM > 0) drills.push({title: 'Reading practice', minutes: readingM, tag: 'reading'});
    if (writingM > 0) drills.push({title: 'Writing / Grammar drills', minutes: writingM, tag: 'writing'});
    drills.push({title: 'Spaced review (errors/vocab)', minutes: reviewM, tag: 'review'});

    // Weekly mini-test on Saturday, full practice test every N days
    const fullTestEveryDays = Math.min(21, Math.max(10, Math.round(daysLeft / 6)));
    if (i === 5) drills.push({title: 'Mini timed section / practice set', minutes: 30, tag: 'practice-test'});

    return {day, tasks: drills};
  });

  return {
    daysLeft,
    improvement,
    suggestedMinutes,
    dailyNeeded,
    intensityRatio,
    plan,
    fullTestEveryDays,
    totalRequiredMinutes
  };
}

function renderRoutine(data, routine) {
  routineEl.innerHTML = '';
  const header = document.createElement('div');
  header.innerHTML = `
    <h2>Hello ${data.name || 'Student'}</h2>
    <p class="small">Target: ${data.target} — Current: ${data.current} — Days left: ${routine.daysLeft}</p>
    <p class="small">Suggested daily time: ${Math.round(routine.suggestedMinutes)} minutes (avg)</p>
  `;
  routineEl.appendChild(header);

  const note = document.createElement('p');
  note.className = 'footer-note';
  const estHours = Math.round((routine.totalRequiredMinutes||0)/60);
  note.textContent = `Estimated focused time to reach target: ${estHours} hours. Take a full practice test every ${routine.fullTestEveryDays} days. Adjust intensity if progress stalls.`;
  routineEl.appendChild(note);

  // Progress summary
  const progressCard = qs('#progress');
  if (progressCard) {
    progressCard.innerHTML = '';
    const progress = loadProgress();
    const totalCompleted = Object.values(progress).reduce((s,v)=>s+Number(v||0),0);
    const totalNeeded = routine.totalRequiredMinutes || 0;
    const pct = totalNeeded > 0 ? Math.min(100, Math.round((totalCompleted/totalNeeded)*100)) : 0;
    const progHeader = document.createElement('div');
    progHeader.innerHTML = `<h3>Progress</h3><p class="small">Completed: ${totalCompleted} min — Estimated needed: ${totalNeeded} min — ${pct}%</p>`;
    progressCard.appendChild(progHeader);
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear progress history';
    clearBtn.style.marginTop = '8px';
    clearBtn.addEventListener('click', () => {
      if (!confirm('Clear all saved progress?')) return;
      localStorage.removeItem('satBooster.progress');
      renderRoutine(data, routine);
    });
    progressCard.appendChild(clearBtn);
  }

  const list = document.createElement('div');
  list.className = 'card';
  list.innerHTML = '<h3>7-day sample routine</h3>';
  routine.plan.forEach(day => {
    const d = document.createElement('div');
    d.className = 'routine-day';
    const total = day.tasks.reduce((s,t)=>s+t.minutes,0);
    d.innerHTML = `<strong>${day.day} — ${total} min</strong><div class="small"></div>`;
    const ul = document.createElement('ul');
    day.tasks.forEach(t => {
      const li = document.createElement('li');
      li.textContent = `${t.title}: ${t.minutes} min`;
      ul.appendChild(li);
    });
    d.appendChild(ul);
    // Add quick mark-complete control
    const btn = document.createElement('button');
    btn.textContent = 'Mark this day complete';
    btn.style.marginTop = '8px';
    btn.addEventListener('click', () => {
      const dateKey = new Date().toISOString().slice(0,10);
      saveProgressEntry(dateKey, total);
      alert(`Saved ${total} minutes for ${dateKey}`);
      renderRoutine(data, routine); // refresh
    });
    d.appendChild(btn);
    list.appendChild(d);
  });
  routineEl.appendChild(list);
}

// Progress persistence: store completed minutes per calendar date
function saveProgressEntry(dateKey, minutes) {
  const raw = localStorage.getItem('satBooster.progress');
  const obj = raw ? JSON.parse(raw) : {};
  obj[dateKey] = (obj[dateKey] || 0) + minutes;
  localStorage.setItem('satBooster.progress', JSON.stringify(obj));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('satBooster.progress');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem('satBooster.profile', JSON.stringify(profile));
    alert('Profile saved locally. You can load it later.');
  } catch (e) {
    console.warn('Could not save:', e);
  }
}

function loadProfile() {
  try {
    const raw = localStorage.getItem('satBooster.profile');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Could not load:', e);
    return null;
  }
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const data = getFormData();
  if (!data.current || !data.target) {
    alert('Please enter current and target scores.');
    return;
  }
  if (data.target <= data.current) {
    if (!confirm('Target is not higher than current. Continue and generate a maintenance plan?')) return;
  }
  const routine = computeRoutine(data);
  renderRoutine(data, routine);
  saveProfile(data);
});

loadBtn.addEventListener('click', () => {
  const p = loadProfile();
  if (!p) { alert('No saved profile found.'); return; }
  qs('#name').value = p.name || '';
  qs('#currentScore').value = p.current || '';
  qs('#targetScore').value = p.target || '';
  qs('#testDate').value = p.testDate ? new Date(p.testDate).toISOString().slice(0,10) : '';
  qs('#focusMath').checked = !!p.focusMath;
  qs('#focusReading').checked = !!p.focusReading;
  qs('#focusWriting').checked = !!p.focusWriting;
  qs('#hoursPerDay').value = p.hoursPerDay || 1;
  // restore topic checkboxes
  qsa('.math-topic').forEach(i => i.checked = Array.isArray(p.mathTopics) && p.mathTopics.includes(i.value));
  qsa('.reading-topic').forEach(i => i.checked = Array.isArray(p.readingTopics) && p.readingTopics.includes(i.value));
  qsa('.writing-topic').forEach(i => i.checked = Array.isArray(p.writingTopics) && p.writingTopics.includes(i.value));
  alert('Loaded saved profile into the form. Click "Create my Routine" to generate.');
});

clearBtn.addEventListener('click', () => {
  if (!confirm('Clear saved profile and form?')) return;
  localStorage.removeItem('satBooster.profile');
  form.reset();
  routineEl.innerHTML = '';
});

// On load, try to populate
(function init() {
  const p = loadProfile();
  if (p) {
    qs('#name').value = p.name || '';
    qs('#currentScore').value = p.current || '';
    qs('#targetScore').value = p.target || '';
    qs('#testDate').value = p.testDate ? new Date(p.testDate).toISOString().slice(0,10) : '';
    qs('#focusMath').checked = !!p.focusMath;
    qs('#focusReading').checked = !!p.focusReading;
    qs('#focusWriting').checked = !!p.focusWriting;
    qs('#hoursPerDay').value = p.hoursPerDay || 1;
    qsa('.math-topic').forEach(i => i.checked = Array.isArray(p.mathTopics) && p.mathTopics.includes(i.value));
    qsa('.reading-topic').forEach(i => i.checked = Array.isArray(p.readingTopics) && p.readingTopics.includes(i.value));
    qsa('.writing-topic').forEach(i => i.checked = Array.isArray(p.writingTopics) && p.writingTopics.includes(i.value));
  }
})();
