const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

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
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5
  }));

  const mouse = { x: width / 2, y: height / 2 };

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(8, 16, 34, 0.72)';
    ctx.fillRect(0, 0, width, height);

    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      const dx = mouse.x - node.x;
      const dy = mouse.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        const force = (180 - dist) / 180;
        node.x -= dx * force * 0.02;
        node.y -= dy * force * 0.02;
      }
    });

    nodes.forEach((node, idx) => {
      for (let j = idx + 1; j < nodes.length; j++) {
        const other = nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          ctx.strokeStyle = `rgba(76, 171, 255, ${1 - dist / 180})`;
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
  const focus = values.topics.length ? values.topics.join(', ') : 'balanced review across all sections';

  return {
    title: `Goal: reach ${target}`,
    summary: `Your current score is ${current}, and you have ${hours} hour(s) per day. This plan emphasizes ${focus}.`,
    tasks: [
      `Practice ${hours >= 2 ? 'two' : 'one'} focused SAT study session${hours >= 2 ? 's' : ''} daily`,
      `Review your weaknesses in ${focus}`,
      `Take a timed mini-test every 7 days`,
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

  registerForm.addEventListener('submit', e => {
    e.preventDefault();
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

    localStorage.setItem('satBooster.user', JSON.stringify(user));
    showPage(pageAchievements);
  });

  achievementForm.addEventListener('submit', e => {
    e.preventDefault();
    const values = {
      target: qs('#achieveTarget').value,
      current: qs('#achieveCurrent').value,
      hours: qs('#achieveHours').value,
      topics: qsa('.struggle-topic:checked').map(i => i.value)
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
