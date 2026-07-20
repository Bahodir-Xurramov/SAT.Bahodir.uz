const qs = selector => document.querySelector(selector);
const qsa = selector => Array.from(document.querySelectorAll(selector));

const pageHome = qs('#pageHome');
const pageAuth = qs('#pageAuth');
const pageSignIn = qs('#pageSignIn');
const pageRegister = qs('#pageRegister');
const pageAchievements = qs('#pageAchievements');
const bgCanvas = qs('#bgCanvas');
const startButton = qs('#startButton');
const goSignIn = qs('#goSignIn');
const goSignInFromAuth = qs('#goSignInFromAuth');
const goSignUp = qs('#goSignUp');
const authBack = qs('#authBack');
const backFromSignIn = qs('#backFromSignIn');
const backToHome = qs('#backToHome');
const backToRegister = qs('#backToRegister');
const registerForm = qs('#registerForm');
const signInForm = qs('#signInForm');
const achievementForm = qs('#achievementForm');
const achievementResults = qs('#achievementResults');

function showPage(page) {
  [pageHome, pageAuth, pageSignIn, pageRegister, pageAchievements].forEach(p => p.classList.remove('active'));
  page.classList.add('active');
}

function initCanvas() {
  const ctx = bgCanvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  bgCanvas.width = width;
  bgCanvas.height = height;

  const nodes = Array.from({ length: 60 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.9,
    vy: (Math.random() - 0.5) * 0.9
  }));

  let drift = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(8, 16, 34, 0.82)';
    ctx.fillRect(0, 0, width, height);

    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
    });

    nodes.forEach((node, idx) => {
      for (let j = idx + 1; j < nodes.length; j++) {
        const other = nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          ctx.strokeStyle = `rgba(94, 180, 255, ${1 - dist / 180})`;
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

    drift += 0.006;
    const offsetX = Math.sin(drift * 0.7) * 14;
    const offsetY = Math.cos(drift * 0.5) * 12;
    bgCanvas.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;

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
    summary: `Your current score is ${current}, and you can study ${hours} hour${hours === 1 ? '' : 's'} per day.`,
    focus: topicList,
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
    <div class="achievement-summary">
      <h3>${plan.title}</h3>
      <p>${plan.summary}</p>
      <p><strong>Focus areas:</strong> ${plan.focus || 'Balanced review across all sections'}</p>
    </div>
    <div class="achievement-tasks">
      <h4>What to work on</h4>
      <ul>${plan.tasks.map(task => `<li>${task}</li>`).join('')}</ul>
    </div>
  `;
}

function initPageEvents() {
  startButton.addEventListener('click', () => showPage(pageAuth));
  goSignIn.addEventListener('click', () => showPage(pageSignIn));
  goSignInFromAuth.addEventListener('click', () => showPage(pageSignIn));
  goSignUp.addEventListener('click', () => showPage(pageRegister));
  authBack.addEventListener('click', () => showPage(pageHome));
  backFromSignIn.addEventListener('click', () => showPage(pageAuth));
  backToHome.addEventListener('click', () => showPage(pageHome));
  backToRegister.addEventListener('click', () => showPage(pageRegister));

  signInForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = qs('#signInEmail').value.trim();
    const password = qs('#signInPassword').value.trim();
    const stored = localStorage.getItem('satBoosterUser');

    if (!email || !password) {
      alert('Please complete both sign in fields.');
      return;
    }

    if (!stored) {
      alert('No account found. Please sign up first.');
      return;
    }

    const user = JSON.parse(stored);
    if (user.email !== email || user.password !== password) {
      alert('Email or password is incorrect.');
      return;
    }

    showPage(pageAchievements);
  });

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

init();
