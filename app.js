const qs = selector => document.querySelector(selector);
const qsa = selector => Array.from(document.querySelectorAll(selector));

const pageHome = qs('#pageHome');
const pageAuth = qs('#pageAuth');
const pageSignIn = qs('#pageSignIn');
const pageRegister = qs('#pageRegister');
const pageVerify = qs('#pageVerify');
const pageAchievements = qs('#pageAchievements');
const pagePractice = qs('#pagePractice');
const bgCanvas = qs('#bgCanvas');
const startButton = qs('#startButton');
const goSignIn = qs('#goSignIn');
const goSignInFromAuth = qs('#goSignInFromAuth');
const goSignUp = qs('#goSignUp');
const authBack = qs('#authBack');
const backFromSignIn = qs('#backFromSignIn');
const backToHome = qs('#backToHome');
const backToRegister = qs('#backToRegister');
const backToSignUp = qs('#backToSignUp');
const registerForm = qs('#registerForm');
const verifyForm = qs('#verifyForm');
const signInForm = qs('#signInForm');
const achievementForm = qs('#achievementForm');
const achievementResults = qs('#achievementResults');
const practiceDashboard = qs('#practiceDashboard');
const viewPlan = qs('#viewPlan');
const signOut = qs('#signOut');

function showPage(page) {
  [pageHome, pageAuth, pageSignIn, pageRegister, pageVerify, pageAchievements, pagePractice].forEach(p => p.classList.remove('active'));
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

function loadActiveSession() {
  const stored = localStorage.getItem('satBoosterUser');
  if (!stored) return false;

  const profile = JSON.parse(stored);
  if (profile.verified && profile.lastSignedIn) {
    populatePracticeDashboard(profile);
    showPage(pagePractice);
    return true;
  }

  return false;
}

function populatePracticeDashboard(profile) {
  if (!practiceDashboard) return;

  const name = profile.nickname || profile.name || 'Student';
  const achievementSummary = profile.achievementPlan ? profile.achievementPlan : null;
  practiceDashboard.innerHTML = `
    <p class="dashboard-welcome">Welcome back, <strong>${name}</strong>!</p>
    <p>Your email: ${profile.email}</p>
    <p>Status: ${profile.verified ? 'Verified' : 'Pending verification'}</p>
    <div class="dashboard-stats">
      <p><strong>Saved score goal:</strong> ${achievementSummary ? achievementSummary.target : 'Not set yet'}</p>
      <p><strong>Preferred focus:</strong> ${achievementSummary ? achievementSummary.focus : 'No focus set'}</p>
    </div>
  `;
}

function saveAchievementSummary(values) {
  const stored = localStorage.getItem('satBoosterUser');
  if (!stored) return;

  const profile = JSON.parse(stored);
  profile.achievementPlan = {
    target: values.target,
    current: values.current,
    hours: values.hours,
    focus: values.topics.length ? values.topics.join(', ') : 'Balanced review across all sections'
  };
  localStorage.setItem('satBoosterUser', JSON.stringify(profile));
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
  backToSignUp.addEventListener('click', () => showPage(pageRegister));

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

    user.lastSignedIn = true;
    localStorage.setItem('satBoosterUser', JSON.stringify(user));
    populatePracticeDashboard(user);
    showPage(pagePractice);
  });

  registerForm.addEventListener('submit', event => {
    event.preventDefault();
    const user = {
      name: qs('#regName').value.trim(),
      surname: qs('#regSurname').value.trim(),
      nickname: qs('#regNickname').value.trim(),
      email: qs('#regEmail').value.trim(),
      password: qs('#regPassword').value.trim(),
      verified: false,
      verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
      lastSignedIn: false
    };

    if (!user.name || !user.surname || !user.nickname || !user.email || !user.password) {
      alert('Please complete all registration fields.');
      return;
    }

    localStorage.setItem('satBoosterUser', JSON.stringify(user));
    alert(`Verification code has been sent to ${user.email}. Code: ${user.verificationCode}`);
    showPage(pageVerify);
  });

  verifyForm.addEventListener('submit', event => {
    event.preventDefault();
    const code = qs('#verifyCode').value.trim();
    const stored = localStorage.getItem('satBoosterUser');

    if (!stored) {
      alert('No account pending verification. Please sign up first.');
      return;
    }

    const user = JSON.parse(stored);
    if (user.verificationCode !== code) {
      alert('Verification code is incorrect.');
      return;
    }

    user.verified = true;
    user.lastSignedIn = true;
    delete user.verificationCode;
    localStorage.setItem('satBoosterUser', JSON.stringify(user));
    populatePracticeDashboard(user);
    showPage(pagePractice);
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

    saveAchievementSummary(values);
    const plan = generateAchievementPlan(values);
    renderAchievementPlan(plan);
  });

  viewPlan.addEventListener('click', () => showPage(pageAchievements));
  signOut.addEventListener('click', () => {
    const stored = localStorage.getItem('satBoosterUser');
    if (stored) {
      const user = JSON.parse(stored);
      user.lastSignedIn = false;
      localStorage.setItem('satBoosterUser', JSON.stringify(user));
    }
    showPage(pageHome);
  });
}

function init() {
  initCanvas();
  initPageEvents();
  if (!loadActiveSession()) {
    showPage(pageHome);
  }
}

init();
