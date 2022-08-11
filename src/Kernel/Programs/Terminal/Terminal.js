const { FONT } = require("../../../Assets/font");
const { DisplayChip } = require("../../../Chips/Display/DisplayChip");
const {
  Welcome,
  Echo,
  Load,
  Colour,
  Edit,
  MakeDirectory,
  ListDirectory,
  Touch,
  ChangeDirectory,
  Run,
  Delete,
  Rmdir,
  Cat,
} = require("./TerminalCommands");

class Terminal {
  constructor(kernel) {
    this.Kernel = kernel;
    this.History = [];
    // STORE CURRENT INPUT
    this.inputBuffer = "";
    this.cursorIndex = 0;

    // FRAMES FOR EACH CURSOR CYCLE
    this.maxCursorBlinkTimout = 16;
    this.cursorShowTimout = 10;
    this.cursorBlinkTimeout = this.maxCursorBlinkTimout;

    this.prevKey == null;
    this.isHeld = false;
    // FRAMES HOLDING DOWN KEY TO BE CONSIDERED HELD
    this.maxHeldTimout = 20;
    this.isHeldTimeout = this.maxHeldTimout;

    this.startTimeout = 40;
    this.startChance = 1;

    this.tabCirculateIndex = 0
    this.prevCommand = ""
  }

  Start() {
    this.History = Welcome();
  }

  Update() {
    this.Kernel.DisplayChip.FillScreen(0);

    let [, height] = this.renderHistory(0);
    // if command history fills screen redraw higher (illusion of scrolling)
    if (height + 5 > 128) {
      this.Kernel.DisplayChip.FillScreen(0);
      [, height] = this.renderHistory(123 - height);
    }

    this.handleInput();

    // NO IDEA WHY THE UNGODLY FUCK THIS WORKS, IF I PUT IT AT THE TOP OF THE FUNCTION IT LITERALLY BREAKS.
    // DO NOT TOUCH!!!
    if (this.Kernel.loadedProgram != this) return;

    let [width] = this.Kernel.FontChip.BlitText(
      this.Kernel.DisplayChip,
      "> ",
      0,
      height,
      7
    );

    // DRWA TEXT INDENTED BY "> "
    this.Kernel.FontChip.BlitTextWrap(
      this.Kernel.DisplayChip,
      this.inputBuffer,
      width,
      height,
      7,
      true
    );

    this.drawCursor(width, height);

    // STATIC WHEN LOADING UP ( IN FIRST x FRAMES )
    if (this.startTimeout > 0) {
      for (let i = 0; i < this.Kernel.DisplayChip.RESOLUTION; i += 2) {
        // IF WITHIN CHANCE THEN DRWA PIXEL WITH RANDOM COLOUR AT EVERY OTHER INDEX ( banding effect )
        if (Math.random() < this.startChance)
          this.Kernel.DisplayChip.pixelData[i] = Math.floor(Math.random() * 16);
      }

      this.startTimeout--;
      // REDUCE CHANCE OF PIXEL TO 0 BY x FRAMES
      this.startChance -= 1 / this.startTimeout;
    }
  }

  appendHistory(type, content, colourCode) {
    this.History.push({
      type: type,
      content: content,
      colour: colourCode,
    });
  }

  HandleTab() {
    let command = this.inputBuffer.toUpperCase().split(" ")[0]

    if (command != this.prevCommand) this.tabCirculateIndex = 0
    this.prevCommand = command

    switch (command) {
      case "CAT":
      case "EDIT":
      case "RUN":
      case "DEL":
        if (this.Kernel.MemoryChip.CurrentDirectory.Files.length < 1) { return }
        if (this.Kernel.MemoryChip.CurrentDirectory.Files.length <= this.tabCirculateIndex) { this.tabCirculateIndex = 0 }
        this.inputBuffer = this.inputBuffer.toUpperCase().split(" ")[0] + " " + this.Kernel.MemoryChip.GetFiles()[this.tabCirculateIndex].Name
        this.tabCirculateIndex ++;
        break;

      case "CD":
      case "RMDIR":
        if (this.Kernel.MemoryChip.CurrentDirectory.SubDirs.length < 1) { return }
        if (this.Kernel.MemoryChip.CurrentDirectory.SubDirs.length <= this.tabCirculateIndex) { this.tabCirculateIndex = 0 }
        this.inputBuffer = this.inputBuffer.toUpperCase().split(" ")[0] + " " + this.Kernel.MemoryChip.GetDirs()[this.tabCirculateIndex].Name
        this.tabCirculateIndex ++;
        break;
    }
  }

  Execute() {
    //TODO: INCLUDE INDENTATION IN STRING (FOR MULTILINE COMMANDS)
    this.appendHistory("string", "> " + this.inputBuffer, 7);

    switch (this.inputBuffer.toUpperCase().split(" ")[0]) {
      case "LOAD":
        Load(this)
        break

      case "RUN":
        Run(this);
        break;

      case "CD":
        ChangeDirectory(this);
        break;

      case "DEL":
        Delete(this);
        break;

      case "RMDIR":
        Rmdir(this);
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
        Echo(this);
        break;

      case "CAT":
        Cat(this);
        break;

      case "COLOUR":
      case "COLOR":
        Colour(this);
        break;

      default:
        this.appendHistory("string", "SYNTAX ERROR", 14);
        break;
    }
    this.inputBuffer = "";
    this.cursorIndex = 0;
    this.Kernel.Save()
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
        break;

      case "TAB":
        this.HandleTab()
        this.cursorIndex = this.inputBuffer.length
        break; 

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
        cursorX = x + 4;
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
