class Editor {
  constructor(Kernel, fileName) {
    this.Kernel = Kernel;
    this.fileName = fileName;
    this.fileData = Kernel.MemoryChip.GetFile(this.fileName).FileData;
    this.cursorIndex = 0;
    this.drawStart = 9 + 3;

    this.maxCursorBlinkTimout = 16;
    this.cursorShowTimout = 10;
    this.cursorBlinkTimeout = this.maxCursorBlinkTimout;

    this.prevKey == null;
    this.isHeld = false;
    this.maxHeldTimout = 20;
    this.isHeldTimeout = this.maxHeldTimout;
  }

  Start() {}

  Update() {
    this.Kernel.DisplayChip.FillScreen(0);
    this.handleInput();

    let [, cursorY] = this.getCursorXY(3, this.drawStart);
    // if (cursorY <= 0) this.drawStart = 128 - cursorY;
    if (cursorY + 6 > 128) this.drawStart -= 6;
    if (cursorY < 9 + 3) this.drawStart += 6;
    console.log(cursorY, this.drawStart);

    this.Kernel.FontChip.BlitTextWrap(
      this.Kernel.DisplayChip,
      this.fileData,
      3,
      this.drawStart,
      7,
      true
    );

    this.drawCursor(3, this.drawStart);
    this.Kernel.DisplayChip.Rect(0, 0, 128, 9, 7);
    this.Kernel.FontChip.BlitText(
      this.Kernel.DisplayChip,
      this.fileName,
      2,
      2,
      0
    );
  }

  handleKeyPress(key) {
    switch (key.toUpperCase()) {
      case "ARROWUP":
        this.cursorUp();
        break;

      case "ARROWDOWN":
        this.cursorDown();
        break;

      case "ARROWRIGHT":
        if (this.cursorIndex < this.fileData.length) this.cursorIndex++;
        break;

      case "ARROWLEFT":
        if (this.cursorIndex > -1) this.cursorIndex--;
        break;

      case "BACKSPACE":
        this.fileData =
          this.fileData.substring(0, this.cursorIndex - 1) +
          this.fileData.substring(this.cursorIndex); // ADD CHARACTER TO CURSOR INDEX
        if (this.cursorIndex > 0) this.cursorIndex--;
        break;

      case "TAB":
        this.insertKey("\t");
        break;

      case "ENTER":
        this.insertKey("\n");
        break;

      default:
        if (this.Kernel.FontChip.FONT[key] != null) {
          this.insertKey(key.toUpperCase());
        }
        break;
    }
  }

  getCursorXY(x, y) {
    let cursorX = x;
    let cursorY = y;
    for (let i = 0; i < this.cursorIndex; i++) {
      cursorX += 4; // SIUMULATE DRAWING CHARS UP TO CURSOR INDEX WITHOUT ACTUALLY DRAWING TO GET CURSOR POSITION

      if (this.fileData[i] == "\n") {
        cursorX = x;
        cursorY += 6;
      } else if (this.fileData[i] == "\t") {
        cursorX += 4 * 2;
      }

      if (
        cursorX + 3 /* WIDTH OF CURSOR*/ >=
        this.Kernel.DisplayChip.PIXEL_DENSITY
      ) {
        cursorX = x;
        cursorY += 6;
      }
    }
    return [cursorX, cursorY];
  }

  getIndexFromPosition(x, y, targetX, targetY) {
    let cursorX = 3;
    let cursorY = 9 + 3;
    for (let i = 0; i < this.fileData.length; i++) {
      cursorX += 4; // SIUMULATE DRAWING CHARS UP TO CURSOR INDEX WITHOUT ACTUALLY DRAWING TO GET CURSOR POSITION

      if (this.fileData[i] == "\n") {
        if (cursorY == targetY) return i;
        cursorX = x;
        cursorY += 6;
      } else if (this.fileData[i] == "\t") {
        cursorX += 4 * 2;
      }

      if (
        cursorX + 3 /* WIDTH OF CURSOR*/ >=
        this.Kernel.DisplayChip.PIXEL_DENSITY
      ) {
        if (cursorY == targetY) return i;
        cursorX = x;
        cursorY += 6;
      }

      if (cursorY == targetY && cursorX == targetX) {
        return i;
      } else if (cursorY == targetY && i == this.fileData.length - 1) {
        return i;
      }
    }

    return this.cursorIndex;
  }

  cursorUp() {
    let [currentX, currentY] = this.getCursorXY(3, 9 + 3);
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

    // let [, newY] = this.getCursorXY(3, this.drawStart);
    // if (newY + 6 >= 128) this.drawStart += 6;
  }

  insertKey(key) {
    this.fileData =
      this.fileData.substring(0, this.cursorIndex) +
      key +
      this.fileData.substring(this.cursorIndex); // ADD CHARACTER TO CURSOR INDEX

    if (this.cursorIndex < this.fileData.length) this.cursorIndex++;
  }

  handleInput() {
    for (let i = 0; i < this.Kernel.KeyboardChip.keyBuffer.length; i++) {
      let key = this.Kernel.KeyboardChip.keyBuffer[i]; // GET NEXT KEY IN BUFFER
      // IF HELD FOR LONG ENOUGH OR NOT HELD (HANDLE PRESS)
      if (this.isHeldTimeout == 0 || this.isHeld == false) {
        this.handleKeyPress(key);
      }

      // IF CHANGE IN KEY OR NO KEY PRESSED, KEY NOT HELD DOWN
      if (this.prevKey != key || key == null) {
        this.isHeld = false;
        this.isHeldTimeout = this.maxHeldTimout;
      } else {
        // OTHERWISE A KEY IS HELD DOWN, BUT IF HELD DOWN FOR LONG ENOUGH (isKeyTimeout) Process as seperate key presses
        this.isHeld = true;
        this.isHeldTimeout--;
      }

      this.Kernel.KeyboardChip.handleKey();
    }
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
  Editor,
};