from pathlib import Path

index_html = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>SAT Booster — Onboarding</title>
  <meta name="description" content="SAT Booster: onboarding flow for Gmail/email registration and achievement planning.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="SAT Booster — Onboarding">
  <meta property="og:description" content="Start your SAT Booster journey with registration and score goal planning.">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="page-shell">
    <canvas id="bgCanvas"></canvas>
    <div class="page-content">
      <section id="pageHome" class="page active home-panel">
        <span class="eyebrow">SAT Booster</span>
        <div class="hero-copy">
          <h1>Prepare smarter for the SAT.</h1>
          <p>Start with a quick registration, set your score goal, and get a custom achievement plan for the areas you want to improve.</p>
        </div>
        <div class="hero-actions">
          <button class="primary" id="startButton">Begin onboarding</button>
        </div>
      </section>

      <section id="pageRegister" class="page card-panel">
        <h2>Create your account</h2>
        <p>Use email or Gmail and a secure password to save your progress.</p>
        <form id="registerForm">
          <label>
            First name
            <input type="text" id="regName" placeholder="First name" required>
          </label>
          <label>
            Last name
            <input type="text" id="regSurname" placeholder="Last name" required>
          </label>
          <label>
            Nickname
            <input type="text" id="regNickname" placeholder="Nickname" required>
          </label>
          <label>
            Email address
            <input type="email" id="regEmail" placeholder="you@example.com" required>
          </label>
          <label>
            Password
            <input type="password" id="regPassword" placeholder="Create a password" required>
          </label>
          <div class="actions">
            <button type="button" class="secondary" id="backToHome">Back</button>
            <button type="submit" class="primary">Continue</button>
          </div>
        </form>
      </section>

      <section id="pageAchievements" class="page card-panel">
        <h2>Plan your achievement</h2>
        <p>Tell us your current score, target score, and the topics you struggle with most.</p>
        <form id="achievementForm">
          <label>
            Current SAT score
            <input type="number" id="achieveCurrent" min="400" max="1600" placeholder="e.g. 980" required>
          </label>
          <label>
            Target SAT score
            <input type="number" id="achieveTarget" min="400" max="1600" placeholder="e.g. 1250" required>
          </label>
          <label>
            Daily study hours
            <input type="number" id="achieveHours" step="0.25" min="0.25" max="12" value="1" required>
          </label>
          <fieldset>
            <legend>Struggle topics</legend>
            <label><input type="checkbox" class="struggle-topic" value="Math"> Math</label>
            <label><input type="checkbox" class="struggle-topic" value="Reading"> Reading</label>
            <label><input type="checkbox" class="struggle-topic" value="Writing"> Writing</label>
            <label><input type="checkbox" class="struggle-topic" value="Grammar"> Grammar</label>
          </fieldset>
          <div class="actions">
            <button type="button" class="secondary" id="backToRegister">Back</button>
            <button type="submit" class="primary">Build my plan</button>
          </div>
        </form>
        <div class="achievement-results hidden" id="achievementResults"></div>
      </section>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>
'''

app_js = '''const qs = selector => document.querySelector(selector);
const qsa = selector => Array.from(document.querySelectorAll(selector));

const pageHome = qs('#pageHome');
const pageRegister = qs('#pageRegister');
const pageAchievements = qs('#pageAchievements');
const bgCanvas = qs('#bgCanvas');
const startButton = qs('#startButton');
const backToHome = qs('#backToHome');
const backToRegister = qs('#backToRegister');
const registerForm = qs('#registerForm');
const achievementForm = qs('#achievementForm');
const achievementResults = qs('#achievementResults');

function showPage(page) {
  [pageHome, pageRegister, pageAchievements].forEach(p => p.classList.remove('active'));
  page.classList.add('active');
}

function initCanvas() {
  const ctx = bgCanvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  bgCanvas.width = width;
  bgCanvas.height = height;

  const nodes = Array.from({ length: 24 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.9,
    vy: (Math.random() - 0.5) * 0.9
  }));

  const mouse = { x: width / 2, y: height / 2 };

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(8, 16, 34, 0.82)';
    ctx.fillRect(0, 0, width, height);

    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      const dx = node.x - mouse.x;
      const dy = node.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        const push = (180 - dist) * 0.01;
        node.x += dx * push;
        node.y += dy * push;
      }
    });

    nodes.forEach((node, idx) => {
      for (let j = idx + 1; j < nodes.length; j++) {
        const other = nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          ctx.strokeStyle = `rgba(94, 180, 255, ${1 - dist / 160})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    });

    nodes.forEach(node => {
      ctx.beginPath();
      ctx.fillStyle = '#7ec5ff';
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    bgCanvas.width = width;
    bgCanvas.height = height;
  });

  draw();
}

function generateAchievementPlan(values) {
  const target = Number(values.target);
  const current = Number(values.current);
  const hours = Number(values.hours);
  const gap = Math.max(0, target - current);
  const milestone = gap ? Math.ceil(gap / 50) * 50 : 100;
  const topicList = values.topics.length ? values.topics.join(', ') : 'balanced review across all sections';

  return {
    title: `Goal: reach ${target}`,
    summary: `Your current score is ${current}, and you can study ${hours} hour${hours === 1 ? '' : 's'} per day. This plan emphasizes ${topicList}.`,
    tasks: [
      `Practice ${hours >= 2 ? 'two' : 'one'} focused SAT study session${hours >= 2 ? 's' : ''} daily`,
      `Review your weaknesses in ${topicList}`,
      'Take a timed mini-test every 7 days',
      `Work toward the next milestone of +${milestone} points`
    ]
  };
}

function renderAchievementPlan(plan) {
  achievementResults.classList.remove('hidden');
  achievementResults.innerHTML = `
    <h3>${plan.title}</h3>
    <p>${plan.summary}</p>
    <ul>${plan.tasks.map(task => `<li>${task}</li>`).join('')}</ul>
  `;
}

function initPageEvents() {
  startButton.addEventListener('click', () => showPage(pageRegister));
  backToHome.addEventListener('click', () => showPage(pageHome));
  backToRegister.addEventListener('click', () => showPage(pageRegister));

  registerForm.addEventListener('submit', event => {
    event.preventDefault();

    const user = {
      name: qs('#regName').value.trim(),
      surname: qs('#regSurname').value.trim(),
      nickname: qs('#regNickname').value.trim(),
      email: qs('#regEmail').value.trim(),
      password: qs('#regPassword').value.trim()
    };

    if (!user.name || !user.surname || !user.nickname || !user.email || !user.password) {
      alert('Please complete all registration fields.');
      return;
    }

    localStorage.setItem('satBoosterUser', JSON.stringify(user));
    showPage(pageAchievements);
  });

  achievementForm.addEventListener('submit', event => {
    event.preventDefault();

    const values = {
      target: qs('#achieveTarget').value,
      current: qs('#achieveCurrent').value,
      hours: qs('#achieveHours').value,
      topics: qsa('.struggle-topic:checked').map(input => input.value)
    };

    if (!values.target || !values.current || !values.hours) {
      alert('Please complete the achievement form.');
      return;
    }

    const plan = generateAchievementPlan(values);
    renderAchievementPlan(plan);
  });
}

function init() {
  initCanvas();
  initPageEvents();
}

init();'''

Path('index.html').write_text(index_html, encoding='utf-8')
Path('app.js').write_text(app_js, encoding='utf-8')
print('wrote files')

