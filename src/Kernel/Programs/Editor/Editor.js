 const {Lexer} = require("../Interpreter/Lexer/lexer.js")
const {Sprite} = require("../Sprite/Sprite.js")
const {TOKENS, KEYWORDS} = require("../Interpreter/Lexer/tokens.js")
const {PREDEFINED_FUNCTIONS} = require("../Interpreter/Evaluator/predefined.js")

class Editor {
  constructor(Kernel, fileName) {
    this.Kernel = Kernel;

    this.fileName = fileName;
    this.fileData = Kernel.MemoryChip.GetFile(this.fileName).FileData;
    this.cursorIndex = 0;

    this.startX = 1;
    this.startY = 9;
    this.drawStartY = 9;
    this.drawStartX = 1;

    this.maxCursorBlinkTimout = 16;
    this.cursorShowTimout = 10;
    this.cursorBlinkTimeout = this.maxCursorBlinkTimout;

    this.prevKey == null;
    this.isHeld = false;
    this.maxHeldTimout = 20;
    this.isHeldTimeout = this.maxHeldTimout;

    this.backgroundColour = 0;
    this.foregroundColour = 7;

    this.tokens = []
  }

  Start() {
    if (this.fileName.split(".").length > 1 && this.fileName.split(".")[this.fileName.split(".").length - 1] == "SPR") {
      this.Kernel.MouseChip.clickBuffer = []

      let sprites = this.Kernel.MemoryChip.GetFile(this.fileName).MetaData["Sprites"]  
      let map = this.Kernel.MemoryChip.GetFile(this.fileName).MetaData["Map"]
      if (sprites == undefined || sprites == []) {
        sprites = []
        for (let i = 0; i < 64; i++) {
          let sprite = {
            sprite: [],
            flags: []
          }

          for (let j = 0; j < 64; j++) {
            sprite.sprite.push(-1)
          }

          for (let j = 0; j < 8; j++) {
            sprite.flags.push(0)
          }
          sprites.push(sprite)
        }
      }

      if (map == undefined || map == []) {
        map = []
        for (let i = 0; i < 128; i++) {
          let row = []
          for (let j = 0; j < 128; j++) {
            row.push(-1)
          }
          map.push(row)
        }
      }

      //new Array(64).fill(new Array(64).fill(-1))
      this.Kernel.loadedProgram = new Sprite(this.Kernel, this.fileName, sprites, map)
      this.Kernel.loadedProgram.Start()
    } else {
      let lexer = new Lexer(this.fileData)
      let [tokens, err] = lexer.Lex(true)
      this.tokens = tokens
    }
  }

  Update() {
    if (this.Kernel.loadedProgram != this) return;
    this.Kernel.DisplayChip.FillScreen(this.backgroundColour);
    this.handleInput();

    let [cursorX, cursorY] = this.getCursorXY(this.drawStartX, this.drawStartY);

    // INSTEAD OF SCROLLING, MODIFY POS (TO start rendering text) (hence appears off screen - illusion of scroll)
    if (cursorY + 6 > 128) this.drawStartY -= 6; // IF AT BOTTOM Of SCREEN (start rendering text heigher)
    if (cursorY < this.startY) this.drawStartY += 6; // IF AT TOP (BELOW TITLE BAR)

    if (cursorX < this.startX) this.drawStartX += 4; // LEFT OF SCREEN
    if (cursorX + 4 > 128) this.drawStartX -= 4; // RIGHT OF SCREEN

    // DISPLAY FILE TEXT
    if (this.fileName.split(".")[this.fileName.split(".").length - 1] == "COP") {
      this.syntaxHighlighting()
    } else {
      this.Kernel.FontChip.BlitText(
        this.Kernel.DisplayChip,
        this.fileData,
        this.drawStartX,
        this.drawStartY,
        this.foregroundColour,
        true
      );
    }


    this.drawCursor(this.drawStartX, this.drawStartY);

    // TITLE BAR
    this.Kernel.DisplayChip.Rect(0, 0, 128, 7, this.foregroundColour);

    //this.Kernel.DisplayChip.Rect(0, 1, 128, 1, this.backgroundColour);

    // SCREEN BORDER - RENDERED ON TOP OF TEXT (HENCE BELOW)
    //this.Kernel.DisplayChip.Rect(0, 127, 128, 1, this.foregroundColour);
    //this.Kernel.DisplayChip.Rect(0, 0, 128, 1, this.foregroundColour);
    //this.Kernel.DisplayChip.Rect(0, 0, 1, 128, this.foregroundColour);
    //this.Kernel.DisplayChip.Rect(127, 0, 1, 128, this.foregroundColour);

    this.Kernel.FontChip.BlitText(
      this.Kernel.DisplayChip,
      this.fileName,
      1,
      1,
      this.backgroundColour
    );
  }

  syntaxHighlighting() {
    //let [tokX, tokY] = [0, 0]
    let x = this.drawStartX
    let y = this.drawStartY

    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i] == null || this.tokens[i].Type == TOKENS.EOF) continue
      let colour = 7

      switch (this.tokens[i].Type) {
        case TOKENS.STRING:
        case TOKENS.NUMBER:
          colour = 6
          break
        case TOKENS.COMMENT:
          colour = 5
          break;
        case TOKENS.IDENTIFIER:
          colour = 7
        default:
          if (KEYWORDS[this.tokens[i].Type] != null)
            colour = 6
          if (PREDEFINED_FUNCTIONS[this.tokens[i].Literal] != null) 
            colour = 7
      }

      let [tokX, tokY] = this.Kernel.FontChip.BlitText(
        this.Kernel.DisplayChip,
        this.tokens[i].Literal,
        x, y, colour, true
      )


      x += tokX 

      if (this.tokens[i].Type == TOKENS.NEW_LINE) {
        x = this.drawStartX
        y += 6
      }
    }
  }

  Save() {
    let file = this.Kernel.MemoryChip.GetFile(this.fileName);
    let fileIndex = this.Kernel.MemoryChip.CurrentDirectory.Files.indexOf(file);
    this.Kernel.MemoryChip.CurrentDirectory.Files[fileIndex].FileData =
      this.fileData;
    this.Kernel.Save()
  }

  handleKeyPress(key) {
    switch (key.toUpperCase()) {
      case "ESCAPE":
        this.Save();
        this.Kernel.Resume(this.Kernel.lastProgram);
        break;

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
        // REMOVE CHAR AT CURSOR_INDEX
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

      case "\"":
        this.insertKey("\"");
        this.insertKey("\"");
        this.cursorIndex--
        break;

      case "{":
        this.insertKey("{");
        this.insertKey("}");
        this.cursorIndex--
        break;

      case "[":
        this.insertKey("[");
        this.insertKey("]");
        this.cursorIndex--
        break;

      case "(":
        this.insertKey("(");
      this.insertKey(")");
        this.cursorIndex--
        break;

      default:
        // IF A FONT CHAR EXISTS
        if (this.Kernel.FontChip.FONT[key] != null) {
          this.insertKey(key.toUpperCase());
        }
        break;
    }

    let lexer = new Lexer(this.fileData)
    let [tokens, err] = lexer.Lex(true)
    this.tokens = tokens
  }

  getCursorXY(x, y) {
    let cursorX = x;
    let cursorY = y;

    // SIMULATE DRAWING CHARS UP TO CURSOR_INDEX TO GET X_Y POS
    for (let i = 0; i < this.cursorIndex; i++) {
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

  insertKey(key) {
    // INSERT CHAR AT INDEX OF CURSOR_INDEX
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
