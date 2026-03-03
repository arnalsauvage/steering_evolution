/**
 * QUAD TREE SAUVAGE - Librairie de partitionnement d'espace
 * Design par Arnal & Django 🎸
 */

class Point {
    constructor(x, y, data) {
        this.x = x;
        this.y = y;
        this.userData = data;
    }
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x; // Centre X
        this.y = y; // Centre Y
        this.w = w; // Demi-largeur
        this.h = h; // Demi-hauteur
    }

    contains(point) {
        return (point.x >= this.x - this.w &&
            point.x <= this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y <= this.y + this.h);
    }

    intersects(range) {
        // Range peut être un Rectangle ou un Circle
        // On utilise les propriétés w et h (ou r pour le cercle)
        let r_w = range.w || range.r;
        let r_h = range.h || range.r;

        return !(range.x - r_w > this.x + this.w ||
            range.x + r_w < this.x - this.w ||
            range.y - r_h > this.y + this.h ||
            range.y + r_h < this.y - this.h);
    }
}

class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.rSquared = this.r * this.r;
        // Propriétés de compatibilité pour Rectangle.intersects
        this.w = r; 
        this.h = r;
    }

    contains(point) {
        let d = Math.pow((point.x - this.x), 2) + Math.pow((point.y - this.y), 2);
        return d <= this.rSquared;
    }
}

class QuadTree {
    constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
    }

    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w / 2;
        let h = this.boundary.h / 2;

        this.northeast = new QuadTree(new Rectangle(x + w, y - h, w, h), this.capacity);
        this.northwest = new QuadTree(new Rectangle(x - w, y - h, w, h), this.capacity);
        this.southeast = new QuadTree(new Rectangle(x + w, y + h, w, h), this.capacity);
        this.southwest = new QuadTree(new Rectangle(x - w, y + h, w, h), this.capacity);

        this.divided = true;
    }

    insert(point) {
        if (!this.boundary.contains(point)) return false;
        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        }
        if (!this.divided) this.subdivide();
        return (this.northeast.insert(point) || this.northwest.insert(point) ||
            this.southeast.insert(point) || this.southwest.insert(point));
    }

    query(range, found) {
        if (!found) found = [];
        if (!this.boundary.intersects(range)) return found;
        
        for (let p of this.points) {
            if (range.contains(p)) found.push(p);
        }
        
        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }
        return found;
    }

    show() {
        stroke(255, 50);
        strokeWeight(1);
        noFill();
        rectMode(CENTER);
        rect(this.boundary.x, this.boundary.y, this.boundary.w * 2, this.boundary.h * 2);
        if (this.divided) {
            this.northeast.show();
            this.northwest.show();
            this.southeast.show();
            this.southwest.show();
        }
    }
}
