class SpriteChip {
  constructor(pixelData, width, height) {
    this.pixelData = pixelData;
    this.width = width;
    this.height = height;
  }

  Blit(DisplayChip, x, y) {
    let xpos = x;
    let ypos = y;
    for (let i = 0; i < this.pixelData.length; i++) {
      if (this.pixelData[i] != -1) {
        if (xpos >= DisplayChip.PIXEL_DENSITY) {
        }
        if (!(xpos < 0 || xpos > 128 || xpos > 128 || ypos < 0))
          DisplayChip.setPixel(xpos, ypos, this.pixelData[i]);
      }

      xpos++;
      if (xpos >= this.width + x) {
        xpos = x;
        ypos++;
      }
    }
    return [this.width, this.height];
  }
}

module.exports = {
  SpriteChip,
};
