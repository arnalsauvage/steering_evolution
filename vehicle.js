// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain

// Steering Evolution
// Another version:
// https://github.com/shiffman/NOC-S17-2-Intelligence-Learning/tree/master/week2-evolution/01_evolve_steering

var mr = 0.10;

function Vehicle(x, y, dna) {
	this.acceleration = createVector(0, 0);
	this.velocity = createVector(0, -2);
	this.position = createVector(x, y);
	this.rayon = 4;
	this.maxspeed = 5;
	this.maxforce = 0.5;
	this.fertilite = 0;

	this.health = 1;

	this.dna = [];
	if (dna === undefined) {
		// Food weight
		this.dna[0] = random(-2, 2);
		// Poison weight
		this.dna[1] = random(-2, 2);
		// Food perception
		this.dna[2] = random(0, 100);
		// Poison Percepton
		this.dna[3] = random(0, 100);
		// Reproduction weight
		this.dna[4] = random(-2, 2);
		// Reproduction perception
		this.dna[5] = random(20, 100);

	}
	else {
		this.dna[0] = dna[0]; // Appétence pour la nourriture
		this.dna[1] = dna[1]; // dégout pour le poison
		this.dna[2] = dna[2]; // Visibilité pour la nourriture
		this.dna[3] = dna[3]; // Visibilité pour le poison
		this.dna[4] = dna[4]; // Appétence pour la reproduction
		this.dna[5] = dna[5]; // visibilité d'un partenaire
	}
	// Mutation
	if (random(1) < mr) {
		this.dna[0] += random(-0.5, 0.5);
	}
	if (random(1) < mr) {
		this.dna[1] += random(-0.5, 0.5);
	}
	if (random(1) < mr) {
		this.dna[2] += random(-20, 20);
	}
	if (random(1) < mr) {
		this.dna[3] += random(-20, 20);
	}
	if (random(1) < mr) {
		this.dna[4] += random(-0.5, 0.5);
	}
	if (random(1) < mr) {
		this.dna[5] += random(-20, 20);
	}

	// Method to update location
	this.update = function() {
		
		// Update velocity
		this.velocity.add(this.acceleration);
		// Limit speed
		this.velocity.limit(this.maxspeed);
		this.position.add(this.velocity);
		// Reset accelerationelertion to 0 each cycle
		this.acceleration.mult(0);

		// l'énergie baisse à l'aune de l'intensité du déplacement
		this.health -= 0.0005 * (abs(this.velocity.x)+abs(this.velocity.y));
	}

	this.applyForce = function(force) {
		// We could add mass here if we want A = F / M
		this.acceleration.add(force);
	}

	this.behaviors = function(good, bad, vehicles, i) {
		var steerR = this.repro(vehicles,i, this.dna[5]);
		if((this.fertilite>0))
		{
			steerR.mult(this.dna[4]);
			this.applyForce(steerR);
		}
		var steerB = this.eat(bad, -0.2, this.dna[3]);
	//	if(this.dna[1]>this.dna[4]&&this.dna[1]>this.dna[0])
	//	{
			steerB.mult(this.dna[1]);
			this.applyForce(steerB);
	//	}		
		
		var steerG = this.eat(good, 0.05, this.dna[2]);
// La nourriture plutot deux fois qu'une'
			steerG.mult(this.dna[0]);
			this.applyForce(steerG);

	//	if(this.dna[0]>this.dna[1]&&this.dna[0]>this.dna[4])
	//	{	
			steerG.mult(this.dna[0]);
			this.applyForce(steerG);
	//	}		
	}

	// On mange si possible, on renvoie le nutrition de la liste le plus proche
	this.eat = function(list, nutrition, perception) {
		var record = Infinity;
		var closest = null;
		for (var i = list.length - 1; i >= 0; i--) {
			var distance = this.position.dist(list[i]);

			if (distance < this.maxspeed) {
				list.splice(i, 1);
				this.health += nutrition;
				this.fertilite++;
			}
			else {
				if (distance < record && distance < perception) {
					record = distance;
					closest = list[i];
				}
			}
		}
		// This is the moment of eating!
		if (closest != null) {
			return this.seek(closest);
		}
		return createVector(0, 0);
	}
  
	// On regarde su le vehicule i de la liste peut se reproduire avec un autre
	// Sinon, on renvoie le plus proche
	this.repro = function(vehicles, i, perception) {
		newVehicle = null;
		vehiculeProche = null;
		// On limite à 200 véhicules le jeu
		if ((newVehicle == null)&&(vehicles.length<100)&&(vehicles[i].fertilite>0)){
			// On parcour tous les véhicules
			for (var j = vehicles.length - 1; j >= 0; j--) {
				if (j != i){     
					var distance = vehicles[i].position.dist(vehicles[j].position);
					// Si un véhicule est à portée, on le locke
					if ((distance < perception )&&(vehicles[j].fertilite>0)) {
						// Si le contact est possible : procréation !
						if ( distance < this.maxspeed) {
							//createjs.Sound.play("son01", createjs.Sound.INTERRUPT_NONE);
							var newdna = [];
							newdna[0] = (vehicles[j].dna[0] + vehicles[i].dna[0]) / 2;
							// Poison weight
							newdna[1] = (vehicles[j].dna[1] + vehicles[i].dna[1]) / 2;
							// Food perception
							newdna[2] = (vehicles[j].dna[2] + vehicles[i].dna[2]) / 2;
							// Poision Percepton
							newdna[3] = (vehicles[j].dna[3] + vehicles[i].dna[3]) / 2;
							newdna[4] = (vehicles[j].dna[4] + vehicles[i].dna[4]) / 2;
							newdna[5] = (vehicles[j].dna[5] + vehicles[i].dna[5]) / 2;
              
							newVehicle = new Vehicle(vehicles[i].position.x, vehicles[i].position.y, newdna);
							vehicles[i].fertilite--;
							vehicles[j].fertilite--;
							newVehicle.health = (vehicles[j].health + vehicles[i].health)/3;
							vehicles[j].health = 2*vehicles[j].health/3 + newVehicle.health/3;
							vehicles[i].health = 2*vehicles[i].health/3 + newVehicle.health/3;
							// On se prépare à sortir de la boucle
							j = -1;
							vehicles.push(newVehicle);
						}
						else{
							vehiculeProche = createVector(vehicles[j].x,vehicles[j].y);	
						}
					}
					else
						vehiculeProche = createVector(vehicles[j].x,vehicles[j].y);	
				}
			}
		}
		if (vehiculeProche != null) {
			return this.seek(vehiculeProche);
		}
		else
			return createVector(random(width), random(height));
	}

	// A method that calculates a steering force towards a target
	// STEER = DESIRED MINUS VELOCITY
	this.seek = function(target) {

		var desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target

		// Scale to maximum speed
		desired.setMag(this.maxspeed);

		// Steering = Desired minus velocity
		var steer = p5.Vector.sub(desired, this.velocity);
		steer.limit(this.maxforce); // Limit to maximum steering force

		return steer;
		//this.applyForce(steer);
	}

	this.dead = function() {
		//createjs.Sound.play("son01", createjs.Sound.INTERRUPT_NONE);
		return (this.health < 0);
	}

	this.display = function() {
		// Draw a triangle rotated in the direction of velocity
		var angle = this.velocity.heading() + PI / 2;

		push();
		translate(this.position.x, this.position.y);
		rotate(angle);

		if (debug.checked()) {
			strokeWeight(3);
			stroke(0, 255, 0);
			noFill();
			line(0, 0, 0, -this.dna[0] * 25);
			strokeWeight(2);
			ellipse(0, 0, this.dna[2] * 2);
			stroke(255, 0, 0);
			line(0, 0, 0, -this.dna[1] * 25);
			ellipse(0, 0, this.dna[3] * 2);
			stroke(122, 0, 125);
			ellipse(0, 0, this.dna[5] * 2);
			line(0, 0, 0, -this.dna[4] * 25);
			stroke(122, 122, 255);

			ellipse(0, 0, this.fertilite * 3);
			strokeWeight(2);			
		}

		var gr = color(0, 255, 0);
		var rd = color(255, 0, 0);
		var col = color(-this.dna[1]*this.health*255, this.dna[0]*this.health*255, this.dna[4]*this.health*255);

		fill(col);
		stroke(col);
		strokeWeight(1);
		beginShape();
		vertex(0, -this.rayon * 2);
		vertex(-this.rayon, this.rayon * 2);
		vertex(this.rayon, this.rayon * 2);
		endShape(CLOSE);

		pop();
	}

	this.boundaries = function() {
		var d = 25;
		var desired = null;

		if (this.position.x < d) {
			desired = createVector(this.maxspeed, this.velocity.y);
		} else if (this.position.x > width - d) {
			desired = createVector(-this.maxspeed, this.velocity.y);
		}

		if (this.position.y < d) {
			desired = createVector(this.velocity.x, this.maxspeed);
		} else if (this.position.y > height - d) {
			desired = createVector(this.velocity.x, -this.maxspeed);
		}

		if (desired !== null) {
			desired.normalize();
			desired.mult(this.maxspeed);
			var steer = p5.Vector.sub(desired, this.velocity);
			steer.limit(this.maxforce);
			this.applyForce(steer);
		}
	}
}
