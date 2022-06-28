const { SpriteChip } = require("./SpriteChip");

class FontChip {
  constructor(font) {
    this.FONT = font;
  }

  BlitText(DisplayChip, message, x, y, colour_code) {
    let xpos = x;
    for (let i = 0; i < message.length; i++) {
      this.BlitCharacter(DisplayChip, message[i], xpos, y, colour_code);
      xpos += 4;
    }
    return [xpos - x, 5];
  }

  BlitTextWrap(DisplayChip, message, x, y, colour_code, inline) {
    let MAXWIDTH = 0;
    let xpos = x;
    let ypos = y;

    for (let i = 0; i < message.length; i++) {
      if (xpos + 4 >= DisplayChip.PIXEL_DENSITY) {
        ypos += 6;
        if (inline) xpos = x;
        else xpos = 0;
      }

      this.BlitCharacter(DisplayChip, message[i], xpos, ypos, colour_code);
      if (xpos > MAXWIDTH) MAXWIDTH = xpos;
      xpos += 4;
    }
    return [MAXWIDTH, ypos + 5 - y];
  }

  BlitCharacter(DisplayChip, char, x, y, colour_code) {
    if (this.FONT[char.toLowerCase()] != null) {
      let charSprite = this.stringToSprite(
        this.FONT[char.toLowerCase()],
        colour_code
      );
      charSprite.Blit(DisplayChip, x, y);
    }
  }

  stringToSprite(binaryString, colour_code) {
    return new SpriteChip(
      binaryString.split("").map((num) => {
        if (num == 0) {
          return -1;
        } else if (num == 1) {
          return colour_code;
        } else return num;
      }),
      3,
      5
    );
  }
}

module.exports = {
  FontChip,
};
