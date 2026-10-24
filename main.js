import * as THREE from 'three';

/* ---------- 3D BACKGROUND (light theme) ---------- */
const canvas = document.querySelector('#bg');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xe6f4ff, 0.028);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.z = 9;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Hero object: solid soft shape wrapped in a wireframe knot
const hero = new THREE.Group();
scene.add(hero);

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.5, 0.42, 180, 20),
  new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true, transparent: true, opacity: 0.55 })
);
hero.add(knot);

const solid = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.5, 0.3, 160, 20),
  new THREE.MeshStandardMaterial({ color: 0xc7d2fe, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.55 })
);
hero.add(solid);

const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.7, 1),
  new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3, flatShading: true })
);
hero.add(core);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(2.6, 0.018, 8, 120),
  new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.7 })
);
ring.rotation.x = Math.PI / 2.4;
hero.add(ring);

// Particle field (soft dots for a light background)
const COUNT = 1200;
const pos = new Float32Array(COUNT * 3);
const col = new Float32Array(COUNT * 3);
const c1 = new THREE.Color(0x4f46e5);
const c2 = new THREE.Color(0x0ea5e9);
for (let i = 0; i < COUNT; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 60;
  pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
  const c = c1.clone().lerp(c2, Math.random());
  col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const particles = new THREE.Points(
  pGeo,
  new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false })
);
scene.add(particles);

// Floating soft shapes
const floaters = [];
const shapeGeos = [
  new THREE.OctahedronGeometry(0.5),
  new THREE.TetrahedronGeometry(0.55),
  new THREE.IcosahedronGeometry(0.45, 0),
];
const palette = [0xc7d2fe, 0xbae6fd, 0xddd6fe];
for (let i = 0; i < 14; i++) {
  const m = new THREE.Mesh(
    shapeGeos[i % 3],
    new THREE.MeshStandardMaterial({ color: palette[i % 3], roughness: 0.4, flatShading: true, transparent: true, opacity: 0.8 })
  );
  m.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 24, -4 - Math.random() * 14);
  m.userData = { speed: 0.2 + Math.random() * 0.6, offset: Math.random() * Math.PI * 2 };
  scene.add(m);
  floaters.push(m);
}

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const light = new THREE.PointLight(0xffffff, 140);
light.position.set(5, 6, 7);
scene.add(light);

// Mouse + scroll
const mouse = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

let scrollProgress = 0;
let lastScroll = window.scrollY;
let scrollBoost = 0;
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = max > 0 ? window.scrollY / max : 0;
  scrollBoost = Math.min(Math.abs(window.scrollY - lastScroll) * 0.002, 0.08);
  lastScroll = window.scrollY;
}, { passive: true });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const speed = reduceMotion ? 0.2 : 1;

  knot.rotation.x = solid.rotation.x = t * 0.25 * speed;
  knot.rotation.y = solid.rotation.y = t * 0.35 * speed + scrollBoost * 10;
  core.rotation.x = -t * 0.6 * speed;
  core.rotation.y = -t * 0.4 * speed;
  ring.rotation.z = t * 0.5 * speed;

  const wide = window.innerWidth > 800;
  const targetX = wide ? 3 * Math.cos(scrollProgress * Math.PI * 4) : 0;
  const targetY = wide ? 0 : 1.5;
  const targetScale = wide ? 1 : 0.6;
  hero.position.x += (targetX - hero.position.x) * 0.05;
  hero.position.y += (targetY - hero.position.y + Math.sin(t) * 0.15) * 0.05;
  hero.scale.setScalar(hero.scale.x + (targetScale - hero.scale.x) * 0.05);

  camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
  camera.position.y += (-mouse.y * 0.8 - camera.position.y) * 0.04;
  camera.position.z = 9 - scrollProgress * 3;
  camera.lookAt(0, 0, 0);

  particles.rotation.y = t * 0.02 * speed + scrollProgress * 1.5;
  particles.rotation.x = scrollProgress * 0.6;

  floaters.forEach((f) => {
    f.rotation.x += 0.004 * f.userData.speed * speed;
    f.rotation.y += 0.006 * f.userData.speed * speed;
    f.position.y += Math.sin(t * f.userData.speed + f.userData.offset) * 0.003;
  });

  scrollBoost *= 0.92;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- PAGE INTERACTIONS ---------- */

// Typing effect
const roles = ['Python Developer', 'Machine Learning Learner', 'Data Enthusiast'];
const typingEl = document.getElementById('typing');
let r = 0, ch = 0, deleting = false;
function type() {
  const word = roles[r];
  typingEl.textContent = word.slice(0, ch);
  if (!deleting && ch < word.length) { ch++; setTimeout(type, 90); }
  else if (!deleting) { deleting = true; setTimeout(type, 1400); }
  else if (ch > 0) { ch--; setTimeout(type, 45); }
  else { deleting = false; r = (r + 1) % roles.length; setTimeout(type, 300); }
}
type();

// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// 3D tilt on cards
document.querySelectorAll('.tilt').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const b = card.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width - 0.5;
    const y = (e.clientY - b.top) / b.height - 0.5;
    card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(8px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// Mobile menu + active link
const menuBtn = document.querySelector('.menu-btn');
const links = document.querySelector('.links');
menuBtn.addEventListener('click', () => links.classList.toggle('open'));
links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));

const navLinks = [...links.querySelectorAll('a')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')));
window.addEventListener('scroll', () => {
  const y = window.scrollY + 160;
  sections.forEach((s, i) => {
    if (s && s.offsetTop <= y && s.offsetTop + s.offsetHeight > y) {
      navLinks.forEach((l) => l.classList.remove('active'));
      navLinks[i].classList.add('active');
    }
  });
}, { passive: true });

document.getElementById('year').textContent = new Date().getFullYear();
