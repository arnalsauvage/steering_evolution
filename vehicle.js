/**
 * CLASSE VEHICLE - Le cœur de la simulation
 * Optimisée par Django & Arnal 🎸
 */

const MUTATION_RATE = 0.10;
const MAX_VEHICLE_COUNT = 1500;
let worldEnergyPool = 1000; 

class Vehicle {
    constructor(x, y, dna, generation = 0) {
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(random(-2, 2), random(-2, 2));
        this.position = createVector(x, y);
        this.r = 4;
        this.maxspeed = 4;
        this.maxforce = 0.4;

        this.health = 1;
        this.fertility = 0;
        this.isFeatured = false;
        this.generation = generation;
        this.name = generateEngagedName();

        this.fights = 0;
        this.matings = 0;
        this.solidarity = 0;

        this.phase = "MIAM"; // Nouvelle phase par défaut
        this.phaseDuration = random(10, 25);

        this.dna = this._initDNA(dna);

        const visionSum = this.dna[2] + this.dna[3] + this.dna[5];
        const weightSum = this.dna[0] + this.dna[1] + this.dna[4];
        this.metabolicRate = (visionSum * 0.0000002) + (weightSum * 0.000001) + 0.00002;
        
        this.baseColor = color(
            constrain(this.dna[4] * 25, 30, 255), 
            constrain(this.dna[0] * 25, 30, 255), 
            constrain(this.dna[1] * 25, 30, 255)
        );

        this.interactionAlpha = 0;
        this.interactionColor = color(255);
    }

    _initDNA(dna) {
        let newDna = [];
        if (dna === undefined) {
            newDna = [random(1, 10), random(1, 10), random(30, 150), random(30, 150), random(1, 10), random(30, 150)];
        } else {
            newDna = [...dna];
        }
        return newDna.map((gene, i) => {
            if (random(1) < MUTATION_RATE) {
                let range = (i === 2 || i === 3 || i === 5) ? 20 : 0.5;
                return gene + random(-range, range);
            }
            return gene;
        });
    }

    update(w, h) {
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxspeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0);

        const movementCost = this.velocity.mag() * 0.00005;
        const totalCost = this.metabolicRate + movementCost;
        
        worldEnergyPool += totalCost;
        this.health -= totalCost;

        this.position.x = constrain(this.position.x, 0, w);
        this.position.y = constrain(this.position.y, 0, h);
        
        if (this.interactionAlpha > 0) this.interactionAlpha -= 10;
    }

    applyForce(force) { this.acceleration.add(force); }

    interact(qVehicles) {
        const range = new Circle(this.position.x, this.position.y, this.r * 4);
        const neighbors = qVehicles.query(range);
        for (let n of neighbors) {
            const other = n.userData;
            if (other === this) continue;

            const d = this.position.dist(other.position);
            if (d < this.r * 2.5) {
                // Combat entre gourmands
                if (this.phase === "MIAM" && other.phase === "MIAM") this._combat(other);
                // Solidarité entre prudents
                if (this.phase === "PEUR" && other.phase === "PEUR") this._solidarity(other);
            }
        }
    }

    _combat(other) {
        this.fights++; other.fights++;
        const totalHealth = this.health + other.health;
        const roll = random(totalHealth);
        let winner = roll < this.health ? this : other;
        let loser = winner === this ? other : this;
        const lossAmount = loser.health * 0.20;
        const gainAmount = loser.health * 0.15;
        const solarTax = loser.health * 0.05;
        winner.health += gainAmount; loser.health -= lossAmount;
        worldEnergyPool += solarTax;
        winner.interactionAlpha = 200; winner.interactionColor = color(255, 255, 0);
        loser.interactionAlpha = 200; loser.interactionColor = color(255, 255, 0);
    }

    _solidarity(other) {
        this.solidarity++; other.solidarity++;
        const gift = (this.health > other.health) ? this.health * 0.1 : other.health * 0.1;
        if (this.health > other.health) { this.health -= gift; other.health += gift; }
        else { other.health -= gift; this.health += gift; }
        this.interactionAlpha = 200; this.interactionColor = color(0, 255, 255);
        other.interactionAlpha = 200; other.interactionColor = color(0, 255, 255);
    }

    behaviors(food, poison, vehicles, qtrees) {
        const { qFood, qPoison, qVehicles } = qtrees;
        let steerPoison = this.eat(poison, -0.2, this.dna[3], qPoison);
        let steerFood = this.eat(food, 0.2, this.dna[2], qFood);
        let steerRepro = this.reproduce(vehicles, this.dna[5], qVehicles);

        switch (this.phase) {
            case "LOVE": this.applyForce(steerRepro.mult(this.dna[4])); break;
            case "PEUR": this.applyForce(steerPoison.mult(-this.dna[1])); break;
            case "MIAM":
            default: this.applyForce(steerFood.mult(this.dna[0])); break;
        }
        this.phaseDuration--;
        if (this.phaseDuration < 0) this.updatePhase();
    }

    updatePhase() {
        const scores = [this.dna[0], this.dna[4], this.dna[1]];
        const total = scores.reduce((a, b) => a + b, 0);
        const roll = random(total);
        if (roll < scores[0]) { 
            this.phase = "MIAM"; 
            this.phaseDuration = 11 * this.dna[0]; 
        } else if (roll < scores[0] + scores[1]) { 
            this.phase = "LOVE"; 
            this.phaseDuration = 11 * this.dna[4]; 
        } else { 
            this.phase = "PEUR"; 
            this.phaseDuration = 11 * this.dna[1]; 
        }
        this.phaseDuration += random(5, 15);
    }

    eat(list, nutrition, perception, qtree) {
        const range = new Circle(this.position.x, this.position.y, perception);
        const points = qtree.query(range);
        let record = Infinity; let closest = null;
        for (let p of points) {
            const item = p.userData; const d = this.position.dist(item);
            if (d < this.maxspeed) {
                const idx = list.indexOf(item);
                if (idx > -1) {
                    list.splice(idx, 1);
                    this.health = constrain(this.health + nutrition, 0, 2);
                    worldEnergyPool -= Math.abs(nutrition);
                    this.fertility += 0.5;
                }
            } else if (d < record) { record = d; closest = item; }
        }
        return closest ? this.seek(closest) : createVector(0, 0);
    }

    reproduce(vehicles, perception, qtreeVehicles) {
        if (vehicles.length >= MAX_VEHICLE_COUNT || this.fertility < 0.5) return createVector(0, 0);
        const range = new Circle(this.position.x, this.position.y, perception);
        const neighbors = qtreeVehicles.query(range);
        let record = Infinity; let closestPartner = null;
        for (let n of neighbors) {
            const other = n.userData;
            if (other === this || other.fertility < 0.5) continue;
            const d = this.position.dist(other.position);
            if (d < this.maxspeed) {
                this.matings++; other.matings++;
                if (random(1) < 0.25) {
                    const childDna = this.dna.map((gene, i) => (gene + other.dna[i]) / 2);
                    const childGen = Math.floor((this.generation + other.generation) / 2) + 1;
                    const child = new Vehicle(this.position.x, this.position.y, childDna, childGen);
                    vehicles.push(child);
                }
                this.fertility = 0; other.fertility = 0;
                this.health *= 0.7; other.health *= 0.7;
                this.interactionAlpha = 255; this.interactionColor = color(255, 0, 255);
                other.interactionAlpha = 255; other.interactionColor = color(255, 0, 255);
                return createVector(0, 0); 
            } else if (d < record) { record = d; closestPartner = other.position; }
        }
        return closestPartner ? this.seek(closestPartner) : createVector(0, 0);
    }

    seek(target) {
        let desired = p5.Vector.sub(target, this.position);
        desired.setMag(this.maxspeed);
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce); return steer;
    }

    boundaries(w, h) {
        const margin = 100; let desired = null;
        if (this.position.x < margin) desired = createVector(this.maxspeed, this.velocity.y);
        else if (this.position.x > w - margin) desired = createVector(-this.maxspeed, this.velocity.y);
        if (this.position.y < margin) desired = createVector(this.velocity.x, this.maxspeed);
        else if (this.position.y > h - margin) desired = createVector(this.velocity.x, -this.maxspeed);
        if (desired) {
            desired.setMag(this.maxspeed);
            let steer = p5.Vector.sub(desired, this.velocity);
            steer.limit(this.maxforce * 2); this.applyForce(steer);
        }
    }

    dead() { 
        const isOld = (this.fights + this.matings >= 100);
        return this.health <= 0 || isOld; 
    }

    display() {
        const angle = this.velocity.heading() + PI / 2;
        push(); translate(this.position.x, this.position.y);
        
        if (this.isFeatured) {
            noStroke();
            fill(this.baseColor.levels[0], this.baseColor.levels[1], this.baseColor.levels[2], 50);
            ellipse(0, 0, this.r * 15);
            push();
            fill(255); noStroke(); textAlign(CENTER); textSize(14);
            text(this.name, 0, -this.r * 5);
            fill(255, 150); textSize(10);
            text(`Gen ${this.generation} | ${this.phase}`, 0, -this.r * 8); // Affiche le mot parlant !
            pop();
        }

        rotate(angle);
        if (this.interactionAlpha > 0) {
            noStroke(); let c = this.interactionColor;
            fill(c.levels[0], c.levels[1], c.levels[2], this.interactionAlpha);
            ellipse(0, 0, this.r * 12);
        }
        if (debugVision.checked() && this.isFeatured) this._drawDebugInfo();
        fill(this.baseColor); stroke(this.baseColor); strokeWeight(1);
        const size = this.r * Math.max(0.5, this.health);
        beginShape(); vertex(0, -size * 2); vertex(-size, size * 2); vertex(size, size * 2); endShape(CLOSE);
        pop();
    }

    _drawDebugInfo() {
        noFill(); strokeWeight(2);
        stroke(0, 255, 50, 180); ellipse(0, 0, this.dna[2] * 2); line(0, 0, 0, -this.dna[0] * 25);
        stroke(0, 180, 255, 180); ellipse(0, 0, this.dna[3] * 2); line(0, 0, 0, this.dna[1] * 25);
        stroke(255, 120, 0, 180); ellipse(0, 0, this.dna[5] * 2); line(0, 0, 0, -this.dna[4] * 25);
        stroke(255, 255, 255, 200); strokeWeight(1.5); ellipse(0, 0, this.fertility * 20);
    }

    setFeatured(val = true) { this.isFeatured = val; }
    getHealth() { return this.health; }
}
