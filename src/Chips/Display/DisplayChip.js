const { PALLETE } = require("../../Assets/pallete");

class DisplayChip {
  constructor(screenSize) {
    this.PIXEL_DENSITY = 128;
    this.RESOLUTION = this.PIXEL_DENSITY ** 2;
    this.PIXEL_SIZE = Math.floor(screenSize / this.PIXEL_DENSITY);
    this.PALLETE = PALLETE;

    this.pixelData = Array(this.PIXEL_DENSITY ** 2).fill(0);
  }

  toIndex(x, y) {
    return y * this.PIXEL_DENSITY + x;
  }

  Rect(x, y, width, height, colour_code, hollow=false) {
    if (hollow) {
      for (let xpos = x; xpos <= x + (width); xpos++) { this.setPixel(xpos, y, colour_code); }
      for (let xpos = x; xpos <= x + (width); xpos++) { this.setPixel(xpos, y+height, colour_code); }
      for (let ypos = y; ypos <= y + (height); ypos++) { this.setPixel(x, ypos, colour_code); }
      for (let ypos = y; ypos <= y + (height); ypos++) { this.setPixel(x+width, ypos, colour_code); }
      return
    }
    // ROW (x to x + width)
    for (let ypos = y; ypos <= y + (height - 1); ypos++) {
      for (let xpos = x; xpos <= x + (width - 1); xpos++) {
        this.setPixel(xpos, ypos, colour_code);
      }
    }
  }

  FillScreen(colour_code) {
    for (let i = 0; i < this.RESOLUTION; i++) {
      this.pixelData[i] = colour_code;
    }
  }

  setPixel(x, y, colour_code) {
    if (x >= this.PIXEL_DENSITY || y >= this.PIXEL_DENSITY) return;
    if (x < 0 || y < 0) return;
    this.pixelData[this.toIndex(x, y)] = colour_code; // CHANGE VALUE AT MEMORY ADDRESS TO COLOUR_CODE
  }

  Draw() {
    let x = 0;
    let y = 0;

    for (let i = 0; i < this.RESOLUTION; i++) {
      let colour_code = this.pixelData[i];
      this.drawPixel(x, y, this.PALLETE[colour_code]);

      x++;
      if (x >= this.PIXEL_DENSITY) {
        x = 0;
        y++;
      }
    }
  }

  drawPixel(x, y, colour) {
    ctx.fillStyle = colour;
    ctx.fillRect(
      x * this.PIXEL_SIZE,
      y * this.PIXEL_SIZE,
      this.PIXEL_SIZE,
      this.PIXEL_SIZE
    );
  }
}

module.exports = {
  DisplayChip,
};
