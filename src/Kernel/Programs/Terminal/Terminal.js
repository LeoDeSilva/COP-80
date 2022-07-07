const { FONT } = require("../../../Assets/font");
const { DisplayChip } = require("../../../Chips/Display/DisplayChip");
const {
  Welcome,
  Echo,
  Colour,
  Edit,
  MakeDirectory,
  ListDirectory,
  Touch,
  ChangeDirectory,
  Run,
} = require("./TerminalCommands");

class Terminal {
  constructor(kernel) {
    this.Kernel = kernel;
    this.History = [];
    this.inputBuffer = "";
    this.cursorIndex = 0;

    this.maxCursorBlinkTimout = 16;
    this.cursorShowTimout = 10;
    this.cursorBlinkTimeout = this.maxCursorBlinkTimout;

    this.prevKey == null;
    this.isHeld = false;
    this.maxHeldTimout = 20;
    this.isHeldTimeout = this.maxHeldTimout;

    this.startTimeout = 40;
    this.startChance = 1;
  }

  Start() {
    this.History = Welcome();
  }

  Update() {
    this.Kernel.DisplayChip.FillScreen(0);
    let [, height] = this.renderHistory(0);
    if (height + 5 > 128) {
      this.Kernel.DisplayChip.FillScreen(0);
      [, height] = this.renderHistory(123 - height);
    }
    this.handleInput();
    let [width] = this.Kernel.FontChip.BlitText(
      this.Kernel.DisplayChip,
      "> ",
      0,
      height,
      7
    );
    this.Kernel.FontChip.BlitTextWrap(
      this.Kernel.DisplayChip,
      this.inputBuffer,
      width,
      height,
      7,
      true
    );
    this.drawCursor(width, height);

    if (this.startTimeout > 0) {
      for (let i = 0; i < this.Kernel.DisplayChip.RESOLUTION; i += 2) {
        if (Math.random() < this.startChance)
          this.Kernel.DisplayChip.pixelData[i] = Math.floor(Math.random() * 16);
      }
      this.startTimeout--;
      this.startChance -= 1 / this.startTimeout;
    }
  }

  Execute() {
    this.History.push({
      type: "string",
      content: "> " + this.inputBuffer,
      colour: 7,
    });

    switch (this.inputBuffer.toUpperCase().split(" ")[0]) {
      case "RUN":
        Run(this);
        break;

      case "CD":
        ChangeDirectory(this);
        break;

      case "LS":
        ListDirectory(this);
        break;

      case "TOUCH":
        Touch(this);
        break;

      case "MKDIR":
        MakeDirectory(this);
        break;

      case "EDIT":
        Edit(this);
        break;

      case "CLS":
        this.History = [];
        break;

      case "WELCOME":
        this.History = Welcome();
        break;

      case "ECHO":
        this.History.push(Echo(this));
        break;

      case "COLOUR":
      case "COLOR":
        this.History.push(Colour(this));
        break;

      default:
        this.History.push({
          type: "string",
          content: "SYNTAX ERROR",
          // content: this.Kernel.ErrorChip.GetError(),
          colour: 14,
        });
        break;
    }
    this.inputBuffer = "";
    this.cursorIndex = 0;
  }

  handleKeyPress(key) {
    switch (key.toUpperCase()) {
      case "ARROWRIGHT":
        if (this.cursorIndex < this.inputBuffer.length) this.cursorIndex++;
        break;

      case "ARROWLEFT":
        if (this.cursorIndex > 0) this.cursorIndex--;
        break;

      case "ENTER":
        this.Execute();

      case "BACKSPACE":
        this.inputBuffer =
          this.inputBuffer.substring(0, this.cursorIndex - 1) +
          this.inputBuffer.substring(this.cursorIndex); // REMOVE CHARACTER BEFORE CURSOR INDEX

        if (this.cursorIndex - 1 >= 0) this.cursorIndex--; // PREVENT CURSOR INDEX < 0
        break;

      default:
        if (this.Kernel.FontChip.FONT[key] != null) {
          this.inputBuffer =
            this.inputBuffer.substring(0, this.cursorIndex) +
            key.toUpperCase() +
            this.inputBuffer.substring(this.cursorIndex); // ADD CHARACTER TO CURSOR INDEX

          if (this.cursorIndex < this.inputBuffer.length) this.cursorIndex++;
        }
        break;
    }
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
    let cursorX = x;
    let cursorY = y;

    for (let i = 0; i < this.cursorIndex; i++) {
      cursorX += 4; // SIUMULATE DRAWING CHARS UP TO CURSOR INDEX WITHOUT ACTUALLY DRAWING TO GET CURSOR POSITION
      if (
        cursorX + 3 /* WIDTH OF CURSOR*/ >=
        this.Kernel.DisplayChip.PIXEL_DENSITY
      ) {
        cursorX = x;
        cursorY += 6;
      }
    }

    if (this.cursorBlinkTimeout == 0)
      this.cursorBlinkTimeout = this.maxCursorBlinkTimout; // RESET BLINK CYCLE
    if (this.cursorBlinkTimeout > this.cursorShowTimout)
      // IF > x THEN SHOW CURSOR
      this.Kernel.DisplayChip.Rect(cursorX, cursorY, 4, 5, 8);
    this.cursorBlinkTimeout--; // DECREMENT CURSOR CUCLE
  }

  renderHistory(y) {
    let height = 0;
    let ypos = y;

    for (let i = 0; i < this.History.length; i++) {
      switch (this.History[i].type) {
        case "function":
          [, height] = this.History[i].content(this.Kernel, ypos);
          ypos += height + 1;
          break;

        case "string":
          [, height] = this.Kernel.FontChip.BlitTextWrap(
            this.Kernel.DisplayChip,
            this.History[i].content,
            0,
            ypos,
            this.History[i].colour,
            true
          );
          ypos += height + 1;
          break;
      }
    }
    return [this.Kernel.DisplayChip.PIXEL_DENSITY, ypos];
  }
}

module.exports = {
  Terminal,
};
