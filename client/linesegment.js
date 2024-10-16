class LineSegment {
    constructor(p0, p1, lineColor, lineWeight) {
      this.p0 = p0.copy();
      this.p1 = p1.copy();
      this.lineColor = lineColor;
      this.lineWeight = lineWeight;
    }
  
    draw() {
      stroke(this.lineColor);
      strokeWeight(this.lineWeight);
      line(this.p0.x, this.p0.y, this.p1.x, this.p1.y);
    }
  }