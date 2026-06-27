let vid;
let reproduciendo = false;
let fc = 0;

let cfg = {
  slice: { on: true,  intensidad: 40, velocidad: 5  },
  rgb:   { on: true,  intensidad: 40, velocidad: 5  },
  noise: { on: false, intensidad: 40, velocidad: 5  },
  scan:  { on: false, intensidad: 40, velocidad: 5  }
};

function setup() {
  createCanvas(windowWidth, windowHeight);

  vid = createVideo('akrii.webm');
  vid.hide();

  let btnPlay = createButton('▶ Play');
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
}

function crearControles(label, clave) {
  let contenedor = createDiv('');
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
}

function draw() {
  frameRate(30);
  background(0);
  fc++;

  // 1. RGB shift
  if (cfg.rgb.on) {
    let off = cfg.rgb.intensidad * 0.12;

    // ↓↓ CAMBIA AQUÍ LOS COLORES DEL SHIFT (R, G, B, opacidad) ↓↓
    tint(255, 0, 0, 200);
    image(vid, -off, 0, width, height);
    tint(255, 80, 80, 150);
    image(vid, off, 0, width, height);
    // ↑↑ ————————————————————————————————————————————————————— ↑↑

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

  // 2. Slice shifting
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
    noStroke();
    fill(0, cfg.scan.intensidad * 0.5);
    for (let y = 0; y < height; y += 3) {
      rect(0, y, width, 1);
    }
    fill(255, 10);
    let scanY = (fc * cfg.scan.velocidad * 2) % height;
    rect(0, scanY, width, 4);
  }
}