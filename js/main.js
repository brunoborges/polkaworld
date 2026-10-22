import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TOUR } from './tour.js';
import { estimateTour } from './insights.js';

const theme = getComputedStyle(document.documentElement);
const themeColor = (name) => theme.getPropertyValue(name).trim();
const BLACK = new THREE.Color(themeColor('--black')).getHex();
const WHITE = new THREE.Color(themeColor('--white')).getHex();
const GOLD = new THREE.Color(themeColor('--gold')).getHex();

const R = 1; // planet radius
const HOVER_ALT = 0.26; // UFO altitude above a stop
const HOVER_TIME = 2.6; // seconds spent beaming over each stop
const FLY_SPEED = 0.55; // radians of arc per second
const UFO_SCALE = 1.7;

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(BLACK);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 100);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 0.9;
controls.maxDistance = 7;
controls.rotateSpeed = 0.5;

scene.add(new THREE.AmbientLight(0xffffff, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-3, 2, 4);
scene.add(sun);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function latLonToVec3(lat, lon, r = R) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function slerpUnit(a, b, t, out = new THREE.Vector3()) {
  const omega = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
  if (omega < 1e-5) return out.copy(a);
  const s = Math.sin(omega);
  return out
    .copy(a)
    .multiplyScalar(Math.sin((1 - t) * omega) / s)
    .addScaledVector(b, Math.sin(t * omega) / s);
}

function dotTexture(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function polkaTexture({ bg, fg, cols = 16, rows = 8, radius = 0.28 }) {
  const w = 512;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  const cw = w / cols;
  const ch = h / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ox = (y % 2) * cw * 0.5;
      g.beginPath();
      g.arc(x * cw + ox + cw / 2, y * ch + ch / 2, Math.min(cw, ch) * radius, 0, Math.PI * 2);
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const DOT = dotTexture();

// A second scene shares the globe's renderer, keeping the title emblem in screen space.
const pyramidScene = new THREE.Scene();
const pyramidCamera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0.1, 10);
pyramidCamera.position.set(2.3, 1.4, 3);
pyramidCamera.lookAt(0, 0, 0);
pyramidScene.add(new THREE.AmbientLight(WHITE, 1.8));
const pyramidLight = new THREE.DirectionalLight(WHITE, 2.4);
pyramidLight.position.set(-3, 4, 2);
pyramidScene.add(pyramidLight);

const pyramidTextureCanvas = document.createElement('canvas');
pyramidTextureCanvas.width = pyramidTextureCanvas.height = 256;
const pyramidPaint = pyramidTextureCanvas.getContext('2d');
pyramidPaint.fillStyle = themeColor('--gold');
pyramidPaint.fillRect(0, 0, 256, 256);
pyramidPaint.fillStyle = themeColor('--black');
for (let i = 0; i < 1100; i++) {
  const x = Math.random() * 256;
  const y = Math.random() * 256;
  pyramidPaint.beginPath();
  pyramidPaint.arc(x, y, 0.4 + Math.random() * 0.6, 0, Math.PI * 2);
  pyramidPaint.fill();
}
const pyramidTexture = new THREE.CanvasTexture(pyramidTextureCanvas);
pyramidTexture.colorSpace = THREE.SRGBColorSpace;
const pyramid = new THREE.Group();
const pyramidGeometry = new THREE.ConeGeometry(0.9, 1.65, 4);
pyramid.add(new THREE.Mesh(
  pyramidGeometry,
  new THREE.MeshStandardMaterial({ map: pyramidTexture, flatShading: true, roughness: 0.8 }),
));
pyramid.add(new THREE.LineSegments(
  new THREE.EdgesGeometry(pyramidGeometry),
  new THREE.LineBasicMaterial({ color: BLACK }),
));
pyramid.rotation.y = Math.PI / 4;
pyramidScene.add(pyramid);
const pyramidFrame = document.getElementById('title-pyramid');
let pyramidBounds = pyramidFrame.getBoundingClientRect();
const fitPyramid = () => { pyramidBounds = pyramidFrame.getBoundingClientRect(); };
new ResizeObserver(fitPyramid).observe(pyramidFrame);

// ---------------------------------------------------------------------------
// Starfield: polka dots in space
// ---------------------------------------------------------------------------
function makeStars(count, color, size, minR, maxR) {
  const pos = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.randomDirection().multiplyScalar(THREE.MathUtils.randFloat(minR, maxR));
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    map: DOT,
    transparent: true,
    alphaTest: 0.5,
    sizeAttenuation: true,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}
const stars = new THREE.Group();
stars.add(makeStars(900, WHITE, 0.09, 12, 30));
stars.add(makeStars(120, GOLD, 0.22, 14, 30));
scene.add(stars);

// ---------------------------------------------------------------------------
// Planet
// ---------------------------------------------------------------------------
const globe = new THREE.Group();
scene.add(globe);

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(R, 96, 64),
  new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9, metalness: 0 }),
);
globe.add(planet);

// Halo
const halo = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.06, 64, 48),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    uniforms: { color: { value: new THREE.Color(WHITE) } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      varying vec3 vNormal;
      void main() {
        float i = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(color, clamp(i, 0.0, 1.0) * 0.55);
      }`,
  }),
);
scene.add(halo);

// Rasterise the land outlines into an equirectangular mask we can sample.
function buildLandMask(topology) {
  const W = 1440;
  const H = 720;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff';
  const land = window.topojson.feature(topology, topology.objects.land);
  const features = land.type === 'FeatureCollection' ? land.features : [land];
  const project = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
  g.beginPath();
  for (const f of features) {
    const geom = f.geometry;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach((pt, i) => {
          const [x, y] = project(pt);
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        });
        g.closePath();
      }
    }
  }
  g.fill('evenodd');
  const data = g.getImageData(0, 0, W, H).data;
  return (lat, lon) => {
    const x = Math.min(W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * W)));
    const y = Math.min(H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * H)));
    return data[(y * W + x) * 4] > 127;
  };
}

// Cover the sphere evenly with dots (Fibonacci lattice); white on land, tiny grey at sea.
function buildPolkaSurface(isLand) {
  const N = 16000;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const land = [];
  const sea = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const lat = THREE.MathUtils.radToDeg(Math.asin(y));
    let lon = THREE.MathUtils.radToDeg((i * golden) % (Math.PI * 2)) - 180;
    (isLand(lat, lon) ? land : sea).push([lat, lon]);
  }

  const dummy = new THREE.Object3D();
  const place = (list, radius, color, rScale) => {
    const geo = new THREE.CircleGeometry(radius, 14);
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([lat, lon], i) => {
      const p = latLonToVec3(lat, lon, R * rScale);
      dummy.position.copy(p);
      dummy.lookAt(p.clone().multiplyScalar(2));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  };
  globe.add(place(land, 0.0105, WHITE, 1.002));
  globe.add(place(sea, 0.0045, 0x3a3a3a, 1.001));
}

fetch('vendor/world-atlas/land-110m.json')
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((topology) => buildPolkaSurface(buildLandMask(topology)))
  .catch((err) => {
    console.warn('Could not load land data, using an all-dots planet instead.', err);
    buildPolkaSurface(() => true);
  });

// ---------------------------------------------------------------------------
// Tour stops: markers + flight arcs
// ---------------------------------------------------------------------------
const stops = TOUR.map((s) => ({ ...s, normal: latLonToVec3(s.lat, s.lon, 1) }));

const markerGeo = new THREE.CircleGeometry(0.022, 32);
const ringGeo = new THREE.RingGeometry(0.026, 0.034, 40);
const pulseGeo = new THREE.RingGeometry(0.03, 0.036, 40);
const markers = stops.map((s) => {
  const g = new THREE.Group();
  g.position.copy(s.normal).multiplyScalar(R * 1.004);
  g.lookAt(s.normal.clone().multiplyScalar(2));
  const disc = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: GOLD }));
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: WHITE, side: THREE.DoubleSide }));
  const pulse = new THREE.Mesh(
    pulseGeo,
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  g.add(disc, ring, pulse);
  g.userData = { disc, ring, pulse };
  globe.add(g);
  return g;
});

function arcAltitude(omega, t) {
  return HOVER_ALT + Math.sin(Math.PI * t) * (0.08 + omega * 0.22);
}

function arcPoint(a, b, t, out = new THREE.Vector3()) {
  const omega = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
  slerpUnit(a, b, t, out);
  return out.multiplyScalar(R + arcAltitude(omega, t));
}

// Dotted trail lines between consecutive stops.
const legs = stops.map((s, i) => {
  const a = s.normal;
  const b = stops[(i + 1) % stops.length].normal;
  const omega = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
  const n = Math.max(6, Math.ceil(omega * 60));
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const p = new THREE.Vector3();
    slerpUnit(a, b, t, p);
    // Trails hug the surface a little lower than the flight path.
    p.multiplyScalar(R + 0.01 + Math.sin(Math.PI * t) * (0.04 + omega * 0.18));
    pts.push(p);
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.PointsMaterial({
    color: WHITE,
    size: 0.018,
    map: DOT,
    transparent: true,
    alphaTest: 0.5,
    opacity: 0.35,
  });
  const line = new THREE.Points(geo, mat);
  globe.add(line);
  return { a, b, omega, duration: Math.max(1.6, omega / FLY_SPEED), line };
});

// ---------------------------------------------------------------------------
// The alien saucer (polka-dotted, of course)
// ---------------------------------------------------------------------------
function buildUFO() {
  const ufo = new THREE.Group();
  const body = new THREE.Group(); // spins
  ufo.add(body);

  const hullTex = polkaTexture({ bg: themeColor('--white'), fg: themeColor('--black'), cols: 14, rows: 6, radius: 0.3 });
  const hull = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 48, 24),
    new THREE.MeshStandardMaterial({ map: hullTex, roughness: 0.4, metalness: 0.2 }),
  );
  hull.scale.set(1, 0.36, 1);
  body.add(hull);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.006, 12, 64),
    new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.5 }),
  );
  rim.rotation.x = Math.PI / 2;
  body.add(rim);

  const domeTex = polkaTexture({ bg: themeColor('--black'), fg: themeColor('--gold'), cols: 10, rows: 5, radius: 0.32 });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: domeTex, roughness: 0.2, metalness: 0.1 }),
  );
  dome.position.y = 0.012;
  body.add(dome);

  const lights = [];
  const lightGeo = new THREE.SphereGeometry(0.0055, 10, 8);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const l = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? WHITE : GOLD }));
    l.position.set(Math.cos(a) * 0.052, -0.006, Math.sin(a) * 0.052);
    body.add(l);
    lights.push(l);
  }

  // Tractor beam: a cone whose apex sits under the saucer and points at the ground.
  const beamGeo = new THREE.ConeGeometry(1, 1, 40, 1, true);
  beamGeo.translate(0, -0.5, 0);
  const beamTex = polkaTexture({ bg: 'rgba(0,0,0,0)', fg: themeColor('--white'), cols: 18, rows: 6, radius: 0.22 });
  beamTex.repeat.set(1, 1);
  const beam = new THREE.Mesh(
    beamGeo,
    new THREE.MeshBasicMaterial({
      color: WHITE,
      map: beamTex,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beam.position.y = -0.01;
  ufo.add(beam);

  const beamGlow = new THREE.Mesh(
    beamGeo,
    new THREE.MeshBasicMaterial({
      color: GOLD,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beamGlow.position.y = -0.01;
  ufo.add(beamGlow);

  ufo.userData = { body, lights, beam, beamGlow, beamTex };
  return ufo;
}

const ufo = buildUFO();
ufo.scale.setScalar(UFO_SCALE);
globe.add(ufo);

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const agendaEl = $('agenda');
const labelEl = $('stop-label');
$('stop-count').textContent = `${stops.length} stops`;
const insights = estimateTour(TOUR);
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
$('insight-stops').textContent = number.format(insights.totalStops);
$('insight-km').textContent = `~${number.format(Math.round(insights.distanceKm / 100) * 100)} km`;
$('insight-miles').textContent = `~${number.format(Math.round(insights.distanceMiles / 100) * 100)} mi`;
$('insight-hours').textContent = `~${number.format(insights.flightHours)} h`;
$('tour-insights').open = !window.matchMedia('(max-width: 760px)').matches;

function setEventLink(link, stop) {
  const action = stop.ticketUrl ? 'Tickets' : 'RSVP';
  link.href = stop.ticketUrl || stop.rsvpUrl;
  link.textContent = action;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${action} for ${stop.venue}, ${stop.city}, ${stop.dates}, 2027 (opens in a new tab)`);
}

const agendaItems = stops.map((s, i) => {
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.type = 'button';
  const pip = document.createElement('span');
  pip.className = 'pip';
  const city = document.createElement('span');
  city.className = 'city';
  city.textContent = `${s.city}, ${s.country}`;
  const meta = document.createElement('span');
  meta.className = 'meta';
  const d = document.createElement('b');
  d.textContent = s.dates;
  meta.append(d, ` · ${s.venue}`);
  btn.append(pip, city, meta);
  btn.addEventListener('click', () => jumpTo(i));
  li.appendChild(btn);
  const link = document.createElement('a');
  link.className = 'event-link';
  setEventLink(link, s);
  li.appendChild(link);
  agendaEl.appendChild(li);
  return li;
});

function setCurrentUI(index, arriving) {
  const s = stops[index];
  $('now-city').textContent = s.city;
  $('now-venue').textContent = `${s.venue} · ${s.country}`;
  $('now-dates').textContent = s.dates;
  setEventLink($('now-event-link'), s);
  document.querySelector('.now-kicker').textContent = arriving ? 'Now landing' : 'Next stop';
  agendaItems.forEach((li, i) => {
    li.classList.toggle('current', i === index);
    li.classList.toggle('visited', i < index);
  });
  agendaItems[index].scrollIntoView({ block: 'center', behavior: 'smooth' });
  labelEl.textContent = s.city;
}

// ---------------------------------------------------------------------------
// Animation state machine: hover over a stop -> fly the arc to the next one
// ---------------------------------------------------------------------------
const state = {
  index: 0, // current (or departing) stop
  phase: 'hover', // 'hover' | 'fly'
  t: 0, // seconds into the current phase
  playing: true,
  follow: true,
};

function jumpTo(i) {
  state.index = i;
  state.phase = 'hover';
  state.t = 0;
  setFollow(true);
  setCurrentUI(i, true);
}

function step(delta) {
  state.index = (state.index + delta + stops.length) % stops.length;
  state.phase = 'hover';
  state.t = 0;
  setCurrentUI(state.index, true);
}

function setPlaying(p) {
  state.playing = p;
  const b = $('btn-play');
  b.textContent = p ? '❚❚' : '►';
  b.title = p ? 'Pause' : 'Play';
  b.setAttribute('aria-label', b.title);
}

function setFollow(f) {
  state.follow = f;
  const b = $('btn-follow');
  b.classList.toggle('active', f);
  b.setAttribute('aria-pressed', String(f));
}

$('btn-prev').addEventListener('click', () => step(-1));
$('btn-next').addEventListener('click', () => step(1));
$('btn-play').addEventListener('click', () => setPlaying(!state.playing));
$('btn-follow').addEventListener('click', () => setFollow(!state.follow));
controls.addEventListener('start', () => setFollow(false));

window.addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('button, a')) return;
  if (e.key === ' ') {
    e.preventDefault();
    setPlaying(!state.playing);
  } else if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'ArrowLeft') step(-1);
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reducedMotion.matches) setPlaying(false);

setCurrentUI(0, true);

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpUp = new THREE.Vector3();
const camDir = new THREE.Vector3();
const projected = new THREE.Vector3();
const tmpN = new THREE.Vector3();
const tmpT = new THREE.Vector3();
const tmpFwd = new THREE.Vector3();
const tmpSide = new THREE.Vector3();
const lastFwd = new THREE.Vector3(1, 0, 0);
const basis = new THREE.Matrix4();

function updateUFO(dt, elapsed) {
  const { body, lights, beam, beamGlow, beamTex } = ufo.userData;
  let pos;
  let ahead;
  let beamStrength = 0;

  if (state.phase === 'hover') {
    const s = stops[state.index];
    const bob = Math.sin(elapsed * 3) * 0.006;
    pos = tmpA.copy(s.normal).multiplyScalar(R + HOVER_ALT + bob);
    const next = stops[(state.index + 1) % stops.length].normal;
    ahead = tmpB.copy(s.normal).lerp(next, 0.02).normalize().multiplyScalar(R + HOVER_ALT);
    // Fade the beam in and out during the hover.
    const k = state.t / HOVER_TIME;
    beamStrength = Math.min(1, k * 5, (1 - k) * 5);
    if (state.playing && state.t >= HOVER_TIME) {
      state.phase = 'fly';
      state.t = 0;
      setCurrentUI((state.index + 1) % stops.length, false);
    }
  } else {
    const leg = legs[state.index];
    const raw = Math.min(1, state.t / leg.duration);
    const t = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2; // ease in-out
    pos = arcPoint(leg.a, leg.b, t, tmpA);
    ahead = arcPoint(leg.a, leg.b, Math.min(1, t + 0.01), tmpB);
    if (raw >= 1) {
      state.index = (state.index + 1) % stops.length;
      state.phase = 'hover';
      state.t = 0;
      setCurrentUI(state.index, true);
    }
  }

  // Orient the saucer: local +Y = away from the planet, local +Z = heading along the surface.
  ufo.position.copy(pos);
  tmpUp.copy(pos).normalize();
  tmpFwd.subVectors(ahead, pos);
  tmpFwd.addScaledVector(tmpUp, -tmpFwd.dot(tmpUp));
  if (tmpFwd.lengthSq() > 1e-12) lastFwd.copy(tmpFwd.normalize());
  else lastFwd.addScaledVector(tmpUp, -lastFwd.dot(tmpUp)).normalize();
  tmpSide.crossVectors(tmpUp, lastFwd).normalize();
  lastFwd.crossVectors(tmpSide, tmpUp).normalize();
  basis.makeBasis(tmpSide, tmpUp, lastFwd);
  ufo.quaternion.setFromRotationMatrix(basis);
  // Slight forward tilt while cruising.
  if (state.phase === 'fly') ufo.rotateX(0.25);

  body.rotation.y += dt * (state.phase === 'fly' ? 4 : 1.5);
  lights.forEach((l, i) => {
    l.visible = Math.floor(elapsed * 6 + i) % 2 === 0;
  });

  const beamLen = (pos.length() - R) / UFO_SCALE;
  beam.scale.set(0.05, beamLen, 0.05);
  beamGlow.scale.set(0.056, beamLen, 0.056);
  beam.material.opacity = beamStrength;
  beamGlow.material.opacity = 0.6 * beamStrength;
  beam.visible = beamGlow.visible = beamStrength > 0.001;
  beamTex.offset.y = -elapsed * 0.6;

  return pos;
}

function updateMarkers(elapsed) {
  markers.forEach((m, i) => {
    const { disc, pulse } = m.userData;
    const isCurrent = i === state.index && state.phase === 'hover';
    const s = isCurrent ? 1.5 : 1;
    disc.scale.setScalar(THREE.MathUtils.lerp(disc.scale.x, s, 0.15));
    if (isCurrent) {
      const p = (elapsed * 0.8) % 1;
      pulse.scale.setScalar(1 + p * 2.5);
      pulse.material.opacity = 1 - p;
    } else {
      pulse.material.opacity = 0;
    }
  });
  legs.forEach((leg, i) => {
    leg.line.material.opacity = i === state.index && state.phase === 'fly' ? 0.95 : 0.3;
  });
}

// Follow camera: aim at the saucer's hover point and look at it from an oblique,
// southward-tilted angle so the saucer, its beam and the ground read as a 3D scene.
const CAM_TILT = THREE.MathUtils.degToRad(24);
const SOUTH = new THREE.Vector3(0, -1, 0);
const camTarget = new THREE.Vector3();
const camOffsetDir = new THREE.Vector3();

function followTargetFor(point, out) {
  return out.copy(point).normalize().multiplyScalar(R + HOVER_ALT * 0.5);
}

function followDirFor(point, out) {
  const n = tmpN.copy(point).normalize();
  const t = tmpT.copy(SOUTH).addScaledVector(n, -SOUTH.dot(n));
  if (t.lengthSq() < 1e-6) return out.copy(n);
  t.normalize();
  return out.copy(n).multiplyScalar(Math.cos(CAM_TILT)).addScaledVector(t, Math.sin(CAM_TILT)).normalize();
}

function updateCamera(ufoPos, dt) {
  if (!state.follow) return;
  const dist = camera.position.distanceTo(controls.target);
  const k = 1 - Math.exp(-dt * 3);
  camDir.copy(camera.position).sub(controls.target).normalize();
  camDir.lerp(followDirFor(ufoPos, tmpUp), k).normalize();
  controls.target.lerp(followTargetFor(ufoPos, camTarget), k);
  camera.position.copy(controls.target).addScaledVector(camDir, dist);
  // Never let a long transition swing the camera through the planet.
  const minR = R + 0.35;
  if (camera.position.length() < minR) camera.position.setLength(minR);
}

function updateLabel() {
  const target = state.phase === 'hover' ? stops[state.index] : stops[(state.index + 1) % stops.length];
  projected.copy(target.normal).multiplyScalar(R * 1.01);
  const facing = projected.clone().normalize().dot(camera.position.clone().normalize());
  projected.project(camera);
  const visible = facing > 0.15 && projected.z < 1;
  labelEl.hidden = !visible;
  if (visible) {
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
    labelEl.style.left = `${x}px`;
    labelEl.style.top = `${y}px`;
  }
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.elapsedTime;
  if (state.playing) state.t += dt;

  const ufoPos = updateUFO(dt, elapsed);
  updateMarkers(elapsed);
  updateCamera(ufoPos, dt);
  stars.rotation.y += dt * 0.004;

  controls.update();
  renderer.render(scene, camera);
  if (state.playing && !reducedMotion.matches && !document.hidden) pyramid.rotation.y += dt * 0.32;
  renderer.autoClear = false;
  renderer.setScissorTest(true);
  const pyramidY = window.innerHeight - pyramidBounds.bottom;
  renderer.setViewport(pyramidBounds.left, pyramidY, pyramidBounds.width, pyramidBounds.height);
  renderer.setScissor(pyramidBounds.left, pyramidY, pyramidBounds.width, pyramidBounds.height);
  renderer.clearDepth();
  renderer.render(pyramidScene, pyramidCamera);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.autoClear = true;
  updateLabel();
}

// On narrow screens the panels cover the lower half, so lift the globe and pull back a bit.
const isNarrow = () => window.innerWidth <= 760;
function fitView() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  if (isNarrow()) camera.setViewOffset(w, h, 0, Math.round(h * 0.2), w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  fitPyramid();
}
window.addEventListener('resize', fitView);
fitView();

// Start the camera on the first stop.
followTargetFor(stops[0].normal, controls.target);
followDirFor(stops[0].normal, camOffsetDir);
camera.position.copy(controls.target).addScaledVector(camOffsetDir, isNarrow() ? 4 : 3.1);

renderer.setAnimationLoop(animate);
