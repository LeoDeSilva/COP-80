const { PALLETE } = require("../../Assets/pallete");

class DisplayChip {
  constructor(screenSize) {
    this.PIXEL_DENSITY = 128;
    this.RESOLUTION = this.PIXEL_DENSITY ** 2;
    this.PIXEL_SIZE = Math.floor(screenSize / this.PIXEL_DENSITY);
    this.PALLETE = PALLETE;

    this.pixelData = Array(this.PIXEL_DENSITY ** 2).fill(0);
    this.pixelBuffer = []
  }

  toIndex(x, y) {
    return y * this.PIXEL_DENSITY + x;
  }

  toCoords(i) {
    let x = i % 128;
    return [x, (i-x)/this.PIXEL_DENSITY];
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
      if (this.pixelData[i] != colour_code) {
        this.pixelData[i] = colour_code;
        this.pixelBuffer.push([i, colour_code])
      }
    }
  }

  setPixel(x, y, colour_code) {
    if (x >= this.PIXEL_DENSITY || y >= this.PIXEL_DENSITY) return;
    if (x < 0 || y < 0) return;
    let index = this.toIndex(x,y)
    if (this.pixelData[index] != colour_code) {
      this.pixelData[index] = colour_code; 
      this.pixelBuffer.push([index, colour_code])
    }
  }

  Draw() {
    //let x = 0;
    //let y = 0;

    //for (let i = 0; i < this.RESOLUTION; i++) {
    //  let colour_code = this.pixelData[i];
    //  if(this.pixelData[i] != this.buffer[i])
    //    this.drawPixel(x, y, this.PALLETE[colour_code]);

    //  x++;
    //  if (x >= this.PIXEL_DENSITY) {
    //    x = 0;
    //    y++;
    //  }
    //}
    //
    console.log(this.pixelBuffer.length)

    //TODO: LOOP BACKWARDS AND IGNORE ANY DUPLICATE INDICIES
    for (let i = 0; i < this.pixelBuffer.length; i++) {
      let [x,y] = this.toCoords(this.pixelBuffer[i][0]);
      this.drawPixel(x, y, this.PALLETE[this.pixelBuffer[i][1]]);
      this.pixelData[this.pixelBuffer[i][0]] = this.pixelBuffer[i][1]
    }

    this.pixelBuffer = [];
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
