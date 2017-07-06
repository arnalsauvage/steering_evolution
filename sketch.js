
// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain

// Steering Evolution
// https://github.com/shiffman/NOC-S17-2-Intelligence-Learning/tree/master/week2-evolution/01_evolve_steering


var vehicles = [];
var food = [];
var poison = [];

var debug;

function setup() {
  createCanvas(1200 , 608);
  for (var i = 0; i < 50; i++) {
    var x = random(width);
    var y = random(height);
    vehicles[i] = new Vehicle(x, y);

    createjs.Sound.addEventListener("fileload", preloadUpdate);
    createjs.Sound.registerSound("son01.mp3", "son01");
    createjs.Sound.registerSound("son02.mp3", "son02");
  }

  for (var i = 0; i < 40; i++) {
    var x = random(width);
    var y = random(height);
    food.push(createVector(x, y));
  }

  for (var i = 0; i < 20; i++) {
    var x = random(width);
    var y = random(height);
    poison.push(createVector(x, y));
  }

  debug = createCheckbox();

}

function mouseDragged() {
  vehicles.push(new Vehicle(mouseX, mouseY));
}

function draw() {
  background(51);

// Création aléatoire de nourriture
  if (random(1) < 0.3) {
    var x = random(width);
    var y = random(height);
    food.push(createVector(x, y));
  }

// Création aléatoire de poison
  if (random(1) < 0.05) {
    var x = random(width);
    var y = random(height);
    poison.push(createVector(x, y));
  }

// Dessine la nourriture
  for (var i = 0; i < food.length; i++) {
    fill(0, 255, 0);
    noStroke();
    ellipse(food[i].x, food[i].y, 4, 4);
  }

// Dessine le poison
  for (var i = 0; i < poison.length; i++) {
    fill(255, 0, 0);
    noStroke();
    ellipse(poison[i].x, poison[i].y, 4, 4);
  }

// Gestion des véhicules
  for (var i = vehicles.length - 1; i >= 0; i--) {
    vehicles[i].boundaries();
    vehicles[i].behaviors(food, poison, vehicles, i);
	if (random(1) < 0.015) {
	  	var x = vehicles[i].position.x;
      	var y = vehicles[i].position.y;
     	food.push(createVector(x, y).sub(vehicles[i].velocity));
	}
    vehicles[i].update();

    vehicles[i].display();
  		  textSize(18);
    text("Nbre vehicules :" + vehicles.length, 20, 20);

    if (vehicles[i].dead()) {
      var x = vehicles[i].position.x;
      var y = vehicles[i].position.y;
      food.push(createVector(x, y));
      vehicles.splice(i, 1);
    }
  }
}

function preloadUpdate() {
    preloadCount++;
    if (preloadCount === PRELOADTOTAL)
        launchGame();
}
