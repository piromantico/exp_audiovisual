let vid;
let reproduciendo = false;
let fc = 0;

let cfg = {
  slice: { on: true,  intensidad: 40, velocidad: 5 },
  rgb:   { on: true,  intensidad: 40, velocidad: 5 },
  noise: { on: false, intensidad: 40, velocidad: 5 },
  scan:  { on: false, intensidad: 40, velocidad: 5 },
  ascii: { on: false, intensidad: 40, velocidad: 5 }
};

const ASCII_CHARS = ' .`^,:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

let samplerCanvas, samplerCtx;
let asciiCanvas,   asciiCtx;
let scanCanvas,    scanCtx;

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30);

  vid = createVideo('akrii.webm');
  vid.hide();

  // Canvas nativo para ASCII — superpuesto al canvas de p5
  asciiCanvas = document.createElement('canvas');
  asciiCanvas.width  = windowWidth;
  asciiCanvas.height = windowHeight;
  asciiCanvas.style.position = 'fixed';
  asciiCanvas.style.top      = '0';
  asciiCanvas.style.left     = '0';
  asciiCanvas.style.display  = 'none';
  asciiCanvas.style.pointerEvents = 'none';
  document.body.appendChild(asciiCanvas);
  asciiCtx = asciiCanvas.getContext('2d');

  // Canvas para samplear píxeles del video
  samplerCanvas = document.createElement('canvas');
  samplerCtx    = samplerCanvas.getContext('2d');

  // Canvas para el patrón de scanlines
  scanCanvas = document.createElement('canvas');
  scanCanvas.width  = 2;
  scanCanvas.height = 3;
  scanCtx = scanCanvas.getContext('2d');

  let btnPlay = createButton('▶ Play');
  btnPlay.style('position', 'relative');
  btnPlay.style('z-index', '10');
  btnPlay.style('margin', '8px 4px 4px');
  btnPlay.style('padding', '5px 16px');
  btnPlay.style('background', '#222');
  btnPlay.style('color', '#fff');
  btnPlay.style('border', 'none');
  btnPlay.style('border-radius', '4px');
  btnPlay.style('cursor', 'pointer');
  btnPlay.style('font-size', '14px');
  btnPlay.mousePressed(() => {
    reproduciendo = !reproduciendo;
    if (reproduciendo) {
      vid.loop();
      btnPlay.html('⏸ Pause');
    } else {
      vid.pause();
      btnPlay.html('▶ Play');
    }
  });

  crearControles('Slice',     'slice');
  crearControles('RGB shift', 'rgb');
  crearControles('Noise',     'noise');
  crearControles('Scanlines', 'scan');
  crearControles('ASCII',     'ascii');
}

function crearControles(label, clave) {
  let contenedor = createDiv('');
  contenedor.style('position', 'relative');
  contenedor.style('z-index', '10');
  contenedor.style('margin', '10px 0 4px');
  contenedor.style('padding', '8px 10px');
  contenedor.style('background', '#1a1a1a');
  contenedor.style('border-radius', '6px');
  contenedor.style('display', 'inline-block');
  contenedor.style('margin-right', '8px');
  contenedor.style('vertical-align', 'top');

  let btn = createButton(label);
  btn.parent(contenedor);
  btn.style('display', 'block');
  btn.style('margin-bottom', '6px');
  btn.style('padding', '3px 10px');
  btn.style('background', cfg[clave].on ? '#444' : '#888');
  btn.style('color', '#fff');
  btn.style('border', 'none');
  btn.style('border-radius', '4px');
  btn.style('cursor', 'pointer');
  btn.style('font-size', '13px');
  btn.mousePressed(() => {
    cfg[clave].on = !cfg[clave].on;
    btn.style('background', cfg[clave].on ? '#444' : '#888');
    if (clave === 'ascii') {
      asciiCanvas.style.display = cfg[clave].on ? 'block' : 'none';
    }
  });

  let labelI = createP('Int: ' + cfg[clave].intensidad);
  labelI.parent(contenedor);
  labelI.style('margin', '2px 0 0');
  labelI.style('font-size', '12px');
  labelI.style('color', '#aaa');
  let sliderI = createSlider(0, 100, cfg[clave].intensidad);
  sliderI.parent(contenedor);
  sliderI.style('width', '120px');
  sliderI.style('display', 'block');
  sliderI.input(() => {
    cfg[clave].intensidad = sliderI.value();
    labelI.html('Int: ' + cfg[clave].intensidad);
  });

  let labelV = createP('Vel: ' + cfg[clave].velocidad);
  labelV.parent(contenedor);
  labelV.style('margin', '4px 0 0');
  labelV.style('font-size', '12px');
  labelV.style('color', '#aaa');
  let sliderV = createSlider(1, 20, cfg[clave].velocidad);
  sliderV.parent(contenedor);
  sliderV.style('width', '120px');
  sliderV.style('display', 'block');
  sliderV.input(() => {
    cfg[clave].velocidad = sliderV.value();
    labelV.html('Vel: ' + cfg[clave].velocidad);
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  asciiCanvas.width  = windowWidth;
  asciiCanvas.height = windowHeight;
}

function dibujarASCII() {
  let vidElem = vid.elt;
  if (vidElem.readyState < 2) return;

  // Resolución: intensidad controla tamaño de celda (8px a 20px)
  let tamCelda = floor(map(cfg.ascii.intensidad, 0, 100, 20, 8));
  let cols     = floor(windowWidth  / tamCelda);
  let rows     = floor(windowHeight / tamCelda);

  // Redimensionar sampler solo si cambió
  if (samplerCanvas.width !== cols || samplerCanvas.height !== rows) {
    samplerCanvas.width  = cols;
    samplerCanvas.height = rows;
  }

  // Samplear el video a baja resolución
  samplerCtx.drawImage(vidElem, 0, 0, cols, rows);
  let pixeles = samplerCtx.getImageData(0, 0, cols, rows).data;

  let celdaW   = windowWidth  / cols;
  let celdaH   = windowHeight / rows;
  let fontSize = floor(min(celdaW, celdaH) * 1.2);

  asciiCtx.fillStyle = '#000';
  asciiCtx.fillRect(0, 0, windowWidth, windowHeight);
  asciiCtx.font = fontSize + 'px monospace';
  asciiCtx.textBaseline = 'top';

  // Un solo loop, fillText directo — sin p5, sin spans, sin innerHTML
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let idx = (j * cols + i) * 4;
      let r   = pixeles[idx];
      let g   = pixeles[idx + 1];
      let b   = pixeles[idx + 2];

      let brillo  = (r * 299 + g * 587 + b * 114) / 1000;
      let charIdx = floor(map(brillo, 0, 255, 0, ASCII_CHARS.length - 1));

      asciiCtx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      asciiCtx.fillText(ASCII_CHARS[charIdx], i * celdaW, j * celdaH);
    }
  }
}

function dibujarScanlines() {
  scanCtx.clearRect(0, 0, 2, 3);
  let alfa = map(cfg.scan.intensidad, 0, 100, 0, 0.8);
  scanCtx.fillStyle = 'rgba(0,0,0,' + alfa + ')';
  scanCtx.fillRect(0, 0, 2, 1);

  let ctx    = drawingContext;
  let patron = ctx.createPattern(scanCanvas, 'repeat');
  ctx.fillStyle = patron;
  ctx.fillRect(0, 0, width, height);

  noStroke();
  fill(255, 10);
  rect(0, (fc * cfg.scan.velocidad * 2) % height, width, 4);
}

function draw() {
  background(0);
  fc++;

  // 1. RGB shift
  if (cfg.rgb.on) {
    let off = cfg.rgb.intensidad * 0.12;
    tint(255, 0, 0, 200);
    image(vid, -off, 0, width, height);
    tint(255, 80, 80, 150);
    image(vid, off, 0, width, height);
    noTint();
    blendMode(MULTIPLY);
    image(vid, 0, 0, width, height);
    blendMode(BLEND);
    blendMode(MULTIPLY);
    fill(255, 80, 80, cfg.rgb.intensidad * 0.6);
    noStroke();
    rect(0, 0, width, height);
    blendMode(BLEND);
  } else {
    noTint();
    image(vid, 0, 0, width, height);
  }

  // 2. Slice
  if (cfg.slice.on) {
    let intervalo = max(1, floor(20 / cfg.slice.velocidad));
    if (fc % intervalo === 0) {
      let numSlices = floor(3 + cfg.slice.intensidad / 15);
      for (let i = 0; i < numSlices; i++) {
        if (random() > 0.5) continue;
        let y    = floor(random(height));
        let h    = floor(2 + random(cfg.slice.intensidad * 0.4 + 2));
        let desp = floor(random(-1, 1) * cfg.slice.intensidad * 0.5);
        copy(0, y, width, h, desp, y, width, h);
      }
    }
  }

  // 3. Noise
  if (cfg.noise.on) {
    noStroke();
    let cantidad = floor(cfg.noise.intensidad * 2);
    for (let i = 0; i < cantidad; i++) {
      fill(random(255), random(255), random(255), random(100, 200));
      rect(random(width), random(height), random(1, 6), random(1, 3));
    }
  }

  // 4. Scanlines
  if (cfg.scan.on) {
    dibujarScanlines();
  }

  // 5. ASCII en canvas nativo separado
  if (cfg.ascii.on) {
    let intervalo = max(1, floor(20 / cfg.ascii.velocidad));
    if (fc % intervalo === 0) {
      dibujarASCII();
    }
  }
}