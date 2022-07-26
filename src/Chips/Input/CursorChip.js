class CursorChip {
   constructor() {
    this.index = 0
    this.maxCursorBlinkTimout = 16;
    this.cursorShowTimout = 10;
    this.cursorBlinkTimeout = this.maxCursorBlinkTimout;
   }

   Update(x, y) {
       let [cursorX, cursorY] = this.getCursorXY(x, y);

       // INSTEAD OF SCROLLING, MODIFY POS (TO start rendering text) (hence appears off screen - illusion of scroll)
       if (cursorY + 6 > 128) this.drawStartY -= 6; // IF AT BOTTOM Of SCREEN (start rendering text heigher)
       if (cursorY < 9 + 3) this.drawStartY += 6; // IF AT TOP (BELOW TITLE BAR)

       if (cursorX < 3) this.drawStartX += 4; // LEFT OF SCREEN
       if (cursorX + 4 > 128) this.drawStartX -= 4; // RIGHT OF SCREEN
   }

  getCursorXY(x, y) {
    let cursorX = x;
    let cursorY = y;

    // SIMULATE DRAWING CHARS UP TO CURSOR_INDEX TO GET X_Y POS
    for (let i = 0; i < this.index; i++) {
      cursorX += 4;

      if (this.fileData[i] == "\n") {
        cursorX = x;
        cursorY += 6;
      } else if (this.fileData[i] == "\t") {
        cursorX += 4 * 2;
      }
    }

    return [cursorX, cursorY];
  }

  // SIMULATE DRAWING CHARS UP TO CURSOR_INDEX TO GET X_Y POS
  getIndexFromPosition(x, y, targetX, targetY) {
    let cursorX = 3;
    let cursorY = 9 + 3; // REPRESENT INDENTATION (WILL PRODUCE ERROR IF INTENTATION CHANGED)
    for (let i = 0; i < this.fileData.length; i++) {
      cursorX += 4;

      if (this.fileData[i] == "\n") {
        if (cursorY == targetY) return i; // IF END OF CORRCT LINE (RETURN POS) : LINE SHORTER THAN PREVIOUS
        cursorX = x;
        cursorY += 6;
      } else if (this.fileData[i] == "\t") {
        cursorX += 4 * 2; // 2 SPACES INDENTATION
      }

      if (cursorY == targetY && cursorX == targetX) {
        // IF CORRECT CHAR POSITION (EXACTLY)
        return i;
      } else if (cursorY == targetY && i == this.fileData.length - 1) {
        // IF END OF FILE IS RIGHT Y AND LINE TOO SHORT (END OF LINE)
        return i;
      }
    }

    return this.cursorIndex;
  }

  cursorUp() {
    let [currentX, currentY] = this.getCursorXY(3, 9 + 3);
    // PRODUCE INDEX OF CURSOR POSITION AT GIVEN X and Y
    this.cursorIndex = this.getIndexFromPosition(
      3,
      9 + 3,
      currentX + 4,
      currentY - 6
    );
  }

  cursorDown() {
    let [currentX, currentY] = this.getCursorXY(3, 9 + 3);
    this.cursorIndex = this.getIndexFromPosition(
      3,
      9 + 3,
      currentX + 4,
      currentY + 6
    );
  }

  drawCursor(x, y) {
    let [cursorX, cursorY] = this.getCursorXY(x, y);

    if (this.cursorBlinkTimeout == 0)
      this.cursorBlinkTimeout = this.maxCursorBlinkTimout; // RESET BLINK CYCLE
    if (this.cursorBlinkTimeout > this.cursorShowTimout)
      // IF > x THEN SHOW CURSOR
      this.Kernel.DisplayChip.Rect(cursorX, cursorY, 4, 5, 8);
    this.cursorBlinkTimeout--; // DECREMENT CURSOR CUCLE
  }
}

module.exports = {
   CursorChip
}
