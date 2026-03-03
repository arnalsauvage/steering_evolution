// Steering Evolution - Optimized & Cleaned
// Design par Arnal & Django 🎸

var vehicles = [];
var food = [];
var poison = [];
var debugQuadTree;
var debugVision;

const VEHICLES_START = 30;
const RATIO_POISON = 0.2;
const FOOD_COST = 0.05; 

let WORLD_WIDTH = 3600;
let WORLD_HEIGHT = 2124;
let zoom = 1.0;
let minZoom = 0.33;
let maxZoom = 5.0;
let viewX, viewY;

let currentSeason = "PRINTEMPS"; 
let energyDirection = 1; 
let isTimelapse = false;
let lastTouchDist = -1;

function setup() {
  let canvasContainer = document.getElementById('canvas-holder');
  let w = canvasContainer.offsetWidth;
  let h = canvasContainer.offsetHeight;
  const canvas = createCanvas(w, h);
  canvas.parent('canvas-holder');
  
  viewX = WORLD_WIDTH / 2;
  viewY = WORLD_HEIGHT / 2;

  initWorld();

  debugQuadTree = createCheckbox('QuadTree', false);
  debugVision = createCheckbox('Vision/ADN', false);

  document.getElementById('btn-random-focus').onclick = selectRandomVehicle;
  document.getElementById('btn-timelapse').onclick = toggleTimelapse;
  document.getElementById('btn-save').onclick = saveGame;
  document.getElementById('btn-load').onclick = loadGame;
}

function initWorld() {
    vehicles = []; food = []; poison = [];
    for (var i = 0; i < VEHICLES_START; i++) {
        vehicles.push(new Vehicle(random(WORLD_WIDTH), random(WORLD_HEIGHT)));
    }
    if (vehicles.length > 0) vehicles[0].setFeatured(true);
    for (var i = 0; i < 300; i++) {
        food.push(createVector(random(WORLD_WIDTH), random(WORLD_HEIGHT)));
    }
}

function toggleTimelapse() {
    isTimelapse = !isTimelapse;
    const btn = document.getElementById('btn-timelapse');
    btn.innerText = isTimelapse ? "⏩ Timelapse : ON (x20)" : "⏩ Timelapse : OFF";
    if (isTimelapse) btn.classList.add('btn-active');
    else btn.classList.remove('btn-active');
}

// --- ÉVÉNEMENTS SOURIS & TACTILE ---

function mouseWheel(event) {
  let zoomSpeed = 0.05;
  if (event.delta > 0) zoom -= zoomSpeed; else zoom += zoomSpeed;
  zoom = constrain(zoom, minZoom, maxZoom);
  return false;
}

function mouseDragged() {
    if (mouseX > width || mouseY > height || mouseX < 0 || mouseY < 0) return;
    let worldPos = getMouseInWorld();
    
    if (worldPos.x > 0 && worldPos.x < WORLD_WIDTH && worldPos.y > 0 && worldPos.y < WORLD_HEIGHT) {
        if (random(1) < 0.1) { // On réduit un peu le débit pour pas surpeupler
            let newVeh;
            if (vehicles.length >= 2) {
                // --- MARIAGE FORCÉ PAR L'UTILISATEUR ---
                let p1 = random(vehicles);
                let p2 = random(vehicles);
                // On s'assure qu'ils sont différents
                while(p1 === p2) { p2 = random(vehicles); }
                
                let childDNA = p1.dna.map((gene, i) => (gene + p2.dna[i]) / 2);
                let childGen = Math.floor((p1.generation + p2.generation) / 2) + 1;
                
                newVeh = new Vehicle(worldPos.x, worldPos.y, childDNA, childGen);
                // On ajoute un petit flash rose pour célébrer l'acte !
                newVeh.interactionAlpha = 255;
                newVeh.interactionColor = color(255, 0, 255);
            } else {
                // Fallback Gen 0 si colonie vide
                newVeh = new Vehicle(worldPos.x, worldPos.y);
            }
            vehicles.push(newVeh);
        }
    }
    return false;
}

function mousePressed() {
    let worldPos = getMouseInWorld();
    for (let v of vehicles) {
        if (dist(worldPos.x, worldPos.y, v.position.x, v.position.y) < 30 / zoom) {
            vehicles.forEach(veh => veh.isFeatured = false);
            v.setFeatured(true);
            return false;
        }
    }
}

function touchStarted() {
    if (touches.length === 2) lastTouchDist = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
    mousePressed();
    return false;
}

function touchMoved() {
    if (touches.length === 2) {
        let currentDist = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
        if (lastTouchDist > 0) {
            let diff = currentDist - lastTouchDist;
            zoom += diff * 0.005;
            zoom = constrain(zoom, minZoom, maxZoom);
        }
        lastTouchDist = currentDist;
        return false;
    }
    mouseDragged();
    return false;
}

function getMouseInWorld() {
    let x = (mouseX - width / 2) / zoom + viewX;
    let y = (mouseY - height / 2) / zoom + viewY;
    return { x, y };
}

// --- BOUCLE PRINCIPALE ---

function draw() {
  if (isTimelapse) { for (let i = 0; i < 20; i++) runLogic(); }
  runLogic();
  renderScene();
  updateFeaturedUI();
  updateEcosystemUI();
  spawnResources();
  displayStats();
}

function runLogic() {
  updateSeasons();
  let boundary = new Rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  let qFood = new QuadTree(boundary, 4);
  let qPoison = new QuadTree(boundary, 4);
  let qVehicles = new QuadTree(boundary, 4);
  for (let f of food) qFood.insert(new Point(f.x, f.y, f));
  for (let p of poison) qPoison.insert(new Point(p.x, p.y, p));
  for (let v of vehicles) qVehicles.insert(new Point(v.position.x, v.position.y, v));
  const qtrees = { qFood, qPoison, qVehicles };
  for (var i = vehicles.length - 1; i >= 0; i--) {
    let v = vehicles[i];
    v.boundaries(WORLD_WIDTH, WORLD_HEIGHT);
    v.interact(qVehicles);
    v.behaviors(food, poison, vehicles, qtrees);
    v.update(WORLD_WIDTH, WORLD_HEIGHT);
    if (v.dead()) {
      food.push(createVector(v.position.x, v.position.y));
      worldEnergyPool += 0.2;
      if (v.isFeatured && vehicles.length > 1) {
        let nextIdx = (i > 0) ? i - 1 : i + 1;
        if (vehicles[nextIdx]) vehicles[nextIdx].setFeatured(true);
      }
      vehicles.splice(i, 1);
    }
  }
}

function renderScene() {
  clear();
  const featured = vehicles.find(v => v.isFeatured);
  if (featured) {
      let visibleW = width / zoom; let visibleH = height / zoom;
      let left = viewX - visibleW / 2; let right = viewX + visibleW / 2;
      let top = viewY - visibleH / 2; let bottom = viewY + visibleH / 2;
      let marginW = visibleW * 0.1; let marginH = visibleH * 0.1;
      if (featured.position.x < left + marginW || featured.position.x > right - marginW ||
          featured.position.y < top + marginH || featured.position.y > bottom - marginH) {
          viewX = featured.position.x; viewY = featured.position.y;
      }
  }
  push();
  translate(width / 2, height / 2); scale(zoom); translate(-viewX, -viewY);
  drawResources();
  for (let v of vehicles) v.display();
  if (debugQuadTree.checked()) {
      let boundary = new Rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
      let qVehicles = new QuadTree(boundary, 4);
      for (let v of vehicles) qVehicles.insert(new Point(v.position.x, v.position.y, v));
      qVehicles.show();
  }
  pop();
}

function windowResized() {
  let canvasContainer = document.getElementById('canvas-holder');
  resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
}

function selectRandomVehicle() {
    if (vehicles.length === 0) return;
    vehicles.forEach(v => v.isFeatured = false);
    const luckyOne = random(vehicles);
    luckyOne.setFeatured(true);
    viewX = luckyOne.position.x;
    viewY = luckyOne.position.y;
}

function saveGame() {
    const gameState = {
        worldEnergyPool, currentSeason, energyDirection,
        zoom, viewX, viewY,
        food: food.map(f => ({x: f.x, y: f.y})),
        poison: poison.map(p => ({x: p.x, y: p.y})),
        vehicles: vehicles.map(v => ({
            x: v.position.x, y: v.position.y,
            dna: v.dna, gen: v.generation,
            name: v.name, health: v.health,
            f: v.fights, m: v.matings, s: v.solidarity,
            isF: v.isFeatured
        }))
    };
    localStorage.setItem('steering_lab_save', JSON.stringify(gameState));
    alert("🧬 Labo sauvegardé !");
}

function loadGame() {
    const data = localStorage.getItem('steering_lab_save');
    if (!data) return alert("Aucune sauvegarde !");
    const state = JSON.parse(data);
    worldEnergyPool = state.worldEnergyPool;
    currentSeason = state.currentSeason;
    energyDirection = state.energyDirection;
    zoom = state.zoom; viewX = state.viewX; viewY = state.viewY;
    food = state.food.map(f => createVector(f.x, f.y));
    poison = state.poison.map(p => createVector(p.x, p.y));
    vehicles = state.vehicles.map(v => {
        let veh = new Vehicle(v.x, v.y, v.dna, v.gen);
        veh.name = v.name; veh.health = v.health;
        veh.fights = v.f; veh.matings = v.m; veh.solidarity = v.s;
        veh.isFeatured = v.isF;
        return veh;
    });
    alert("📂 Labo restauré !");
}

function updateSeasons() {
    let solarFlux = 0.4; 
    if (energyDirection === 1) { worldEnergyPool += solarFlux; if (worldEnergyPool >= 1000) energyDirection = -1; }
    else { worldEnergyPool -= solarFlux; if (worldEnergyPool <= 0) energyDirection = 1; }
    worldEnergyPool = constrain(worldEnergyPool, 0, 1000);
    if (worldEnergyPool <= 250) currentSeason = "HIVER";
    else if (worldEnergyPool >= 750) currentSeason = "ÉTÉ";
    else if (energyDirection === 1) currentSeason = "PRINTEMPS";
    else currentSeason = "AUTOMNE";
}

function updateEcosystemUI() {
    const sName = document.getElementById('season-name');
    const eBar = document.getElementById('energy-bar');
    if (!sName || !eBar) return;
    sName.innerText = currentSeason;
    let sColor;
    switch(currentSeason) {
        case "PRINTEMPS": sColor = "#00ff88"; break;
        case "ÉTÉ": sColor = "#ffaa00"; break;
        case "AUTOMNE": sColor = "#ff6600"; break;
        case "HIVER": sColor = "#00aaff"; break;
    }
    sName.style.color = sColor;
    eBar.style.width = `${(worldEnergyPool / 1000) * 100}%`;
    eBar.style.background = sColor;
}

function updateFeaturedUI() {
    const v = vehicles.find(veh => veh.isFeatured);
    if (!v) return;

    // --- CORRECTION DES IDS POUR MATCH HTML v2.8 ---
    const nameEl = document.getElementById('feat-name');
    if (nameEl) nameEl.innerText = v.name;

    const h = document.getElementById('feat-health');
    const g = document.getElementById('feat-gen');
    const p = document.getElementById('feat-phase');
    const f = document.getElementById('feat-fights');
    const m = document.getElementById('feat-matings');
    const d = document.getElementById('feat-solidarity');
    
    if (h) h.innerText = v.health.toFixed(2);
    if (g) g.innerText = v.generation;
    if (p) p.innerText = v.phase;
    if (f) f.innerText = v.fights;
    if (m) m.innerText = v.matings;
    if (d) d.innerText = v.solidarity;

    // ADN Poids
    const barF = document.getElementById('bar-f-w');
    const barP = document.getElementById('bar-p-w');
    const barR = document.getElementById('bar-r-w');
    const valF = document.getElementById('val-f-w');
    const valP = document.getElementById('val-p-w');
    const valR = document.getElementById('val-r-w');

    if (barF) barF.style.width = `${v.dna[0] * 10}%`;
    if (valF) valF.innerText = v.dna[0].toFixed(1);
    if (barP) barP.style.width = `${v.dna[1] * 10}%`;
    if (valP) valP.innerText = v.dna[1].toFixed(1);
    if (barR) barR.style.width = `${v.dna[4] * 10}%`;
    if (valR) valR.innerText = v.dna[4].toFixed(1);
    
    // ADN Vision
    const barFv = document.getElementById('bar-f-v');
    const valFv = document.getElementById('val-f-v');
    const barPv = document.getElementById('bar-p-v');
    const valPv = document.getElementById('val-p-v');
    const barRv = document.getElementById('bar-r-v');
    const valRv = document.getElementById('val-r-v');

    if (barFv) barFv.style.width = `${(v.dna[2]/150)*100}%`;
    if (valFv) valFv.innerText = v.dna[2].toFixed(0);
    if (barPv) barPv.style.width = `${(v.dna[3]/150)*100}%`;
    if (valPv) valPv.innerText = v.dna[3].toFixed(0);
    if (barRv) barRv.style.width = `${(v.dna[5]/150)*100}%`;
    if (valRv) valRv.innerText = v.dna[5].toFixed(0);
}

function drawResources() {
  noStroke();
  fill(0, 255, 0); for (let f of food) ellipse(f.x, f.y, 4, 4);
  fill(255, 0, 0); for (let p of poison) ellipse(p.x, p.y, 4, 4);
}

function displayStats() {
  fill(255, 150); noStroke(); textSize(12);
  text(`Agents: ${vehicles.length} | Miam: ${food.length}`, 10, 20);
}

function spawnResources() {
  const MAX_POISON = 150;
  let foodTarget;
  if (worldEnergyPool < 250) foodTarget = map(worldEnergyPool, 0, 250, 0, vehicles.length * 2);
  else foodTarget = map(worldEnergyPool, 250, 1000, vehicles.length * 2, vehicles.length * 6);
  for (let i = 0; i < 5; i++) {
    if (food.length < foodTarget) {
      if (random(1) < 0.5) {
        food.push(createVector(random(WORLD_WIDTH), random(WORLD_HEIGHT)));
        if (worldEnergyPool > FOOD_COST) worldEnergyPool -= FOOD_COST;
      }
    }
  }
  if (food.length > foodTarget && random(1) < 0.2) food.splice(floor(random(food.length)), 1);
  if (poison.length < food.length * 0.2 && poison.length < MAX_POISON) {
    if (random(1) < 0.01) poison.push(createVector(random(WORLD_WIDTH), random(WORLD_HEIGHT)));
  }
}
