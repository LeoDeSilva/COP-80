const {SpriteChip} = require("../../../Chips/Display/SpriteChip.js")
const {ICONS} = require("../../../Assets/icons.js")

class Button {
  constructor(Kernel, x, y, w, h, c) {
    this.Kernel = Kernel
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.colour = c

  }

  Draw() {
    if (this.colour != -1) {
      this.Kernel.DisplayChip.Rect(this.x, this.y, this.w, this.h, this.colour)
      return
    } 

    this.Kernel.DisplayChip.Rect(this.x, this.y, this.w, this.h, 5)
    this.Kernel.DisplayChip.Rect(this.x, this.y, this.w/2, this.h/2, 6)
    this.Kernel.DisplayChip.Rect(this.x+this.w/2, this.y+this.h/2, this.w/2, this.h/2, 6)
  }

  Clicked(click) {
    if (click.x >= this.x && click.x < this.x + this.w) {
      if (click.y >= this.y && click.y < this.y + this.h) {
        return true
      }
    } 

    return false
  }
}

class Sprite {
  constructor(Kernel, fileName, sprites, map) {
    this.Kernel = Kernel
    this.fileName = fileName

    this.pixelsX = 1
    this.pixelsY = 15
    this.pixels = this.populatePixels()

    this.palleteX = 87
    this.palleteY = 15
    this.colour = 7;
    this.pallete = this.populatePallete()

    this.spritesX = 0
    this.spritesY = 96
    this.spriteIndex = 0
    this.sprites = sprites
    this.spriteButtons = this.populateSprites()

    this.mapX = 0
    this.mapY = 7
    this.mapIndexX = 0 
    this.mapIndexY = 0
    this.map = map

    this.flagX = 0
    this.flagY = this.pixelsY+66
    this.flags = this.populateFlags()
    //this.mapButtons = this.populateMap()

    this.mapEditor = false
    this.switchButton = new Button(this.Kernel, 120, 0, 8, 8, 0)
    
    for (let i = 0; i < this.pixels.length; i++) {
      this.pixels[i].colour = this.sprites[this.spriteButtons[this.spriteIndex].colour].sprite[i]
    }
  }

  populateFlags() {
    let flags = []
    let x = this.flagX
    for (let i = 0; i < 8; i++) {
      flags.push(new Button(this.Kernel, x, this.flagY, 5, 5, 7))
      x+=6
    }

    return flags
  }

  populateSprites() {
    let sprites = []
    let index = 0
    let y = this.spritesY
    for (let i = 0; i < 4; i++) {
      let x = this.spritesX
      for (let j = 0; j < 16; j++) {
        sprites.push(new Button(this.Kernel, x, y, 8, 8, index))
        x += 8
        index++
      }
      y += 8
    }

    return sprites
  }

  populatePallete() {
    let pallete = []
    let y = this.palleteY
    let colour = 0
    for (let i = 0; i < 4; i++) {
      let x = this.palleteX;
      for (let j = 0; j < 4; j++) {
        pallete.push(new Button(this.Kernel, x, y, 8, 8, colour))
        colour ++
        x += 8
      }

      y += 8
    }

    return pallete

  }

  populatePixels() {
    let pixels = []
    let y = this.pixelsY
    for (let i = 0; i < 8; i++) {
      let x = this.pixelsX;
      for (let j = 0; j < 8; j++) {
        pixels.push(new Button(this.Kernel, x, y, 8, 8, -1))
        x += 8
      }

      y += 8
    }

    return pixels
  }

  Start() {
    this.Kernel.DisplayChip.FillScreen(0);
  }

  Update() {
    if (this.mapEditor) this.MapUpdate()
    else this.PixelArtUpdate()
  }

  MapUpdate() {
    if (this.Kernel.loadedProgram != this) return;

    if (this.Kernel.KeyboardChip.isPressed("Escape")) {
        this.Save();
        this.Kernel.Resume(this.Kernel.lastProgram);
    } //else if (this.Kernel.KeyboardChip.isPressed("M") || this.Kernel.KeyboardChip.isPressed("S")) {
     // this.mapEditor = false
    //}

    this.HandleClick()
    this.HandleInput()

    this.Kernel.DisplayChip.FillScreen(0);

    let x = this.mapX
    let y = this.mapY
    let yIndex = this.mapIndexY
    while (yIndex < this.mapIndexY + 11) {
      let xIndex = this.mapIndexX
      while (xIndex < this.mapIndexX + 16) {
        //if (this.map[yIndex][xIndex] == -1) {
        this.Kernel.DisplayChip.Rect(x, y, 8, 8, 5)
        this.Kernel.DisplayChip.Rect(x, y, 4, 4, 6)
        this.Kernel.DisplayChip.Rect(x+4, y+4, 4, 4, 6)
        if (this.map[yIndex][xIndex] != -1) {
          let sprite = new SpriteChip(this.sprites[this.map[yIndex][xIndex]].sprite, 8, 8) 
          sprite.Blit(this.Kernel.DisplayChip, x, y)
        }
        xIndex++
        x += 8
      }
      y += 8
      x = 0
      yIndex++
    }

    this.Kernel.DisplayChip.Rect(0, 96, 128, 32, 0)

    this.Kernel.DisplayChip.Rect(0, 0, 128, 7, 7);
    this.Kernel.FontChip.BlitText(
      this.Kernel.DisplayChip,
      this.fileName,
      1,
      1,
      0,
    );

    ICONS["map-icon"].Blit(this.Kernel.DisplayChip, 120, 0)

    this.Kernel.DisplayChip.Rect(0, this.spritesY-1, 128, 1, 7)
    for (let i = 0; i < this.spriteButtons.length; i++) {
      let sprite = new SpriteChip(this.sprites[this.spriteButtons[i].colour].sprite, 8, 8) 
      sprite.Blit(this.Kernel.DisplayChip, this.spriteButtons[i].x, this.spriteButtons[i].y)
    }

    this.Kernel.DisplayChip.Rect(this.spriteButtons[this.spriteIndex].x, this.spriteButtons[this.spriteIndex].y, 7, 7, 7, true)

  }

  PixelArtUpdate() {
    if (this.Kernel.loadedProgram != this) return;

    if (this.Kernel.KeyboardChip.isPressed("Escape")) {
        this.Save();
        this.Kernel.Resume(this.Kernel.lastProgram);
    }// else if (this.Kernel.KeyboardChip.isPressed("M") || this.Kernel.KeyboardChip.isPressed("S")) {
     // this.mapEditor = true
   // }

    if (this.Kernel.KeyboardChip.isPressed("p")) {
    }

    this.HandleClick()

    this.Kernel.DisplayChip.FillScreen(0);

    this.Kernel.DisplayChip.Rect(0, 0, 128, 7, 7);
    this.Kernel.FontChip.BlitText(
      this.Kernel.DisplayChip,
      this.fileName,
      1,
      1,
      0,
    );

    ICONS["map-icon"].Blit(this.Kernel.DisplayChip, 120, 0)

    this.Kernel.DisplayChip.Rect(this.pixelsX-1, this.pixelsY-1, 66, 66, 7)
    for (let i = 0; i < this.pixels.length; i++) {
      this.pixels[i].Draw()
    }
    this.Kernel.FontChip.BlitText(
      this.Kernel.DisplayChip,
      "#" + this.spriteIndex.toString(),
      this.palleteX - 1,
      this.palleteY+34,
      7,
    );

    this.Kernel.DisplayChip.Rect(this.palleteX-1, this.palleteY-1, 34, 34, 7)
    for (let i = 0; i < this.pallete.length; i++) {
      this.pallete[i].Draw()
      if (i == this.colour) {
        this.Kernel.DisplayChip.Rect(this.pallete[i].x, this.pallete[i].y, 8, 8, 0)
        this.Kernel.DisplayChip.Rect(this.pallete[i].x-1, this.pallete[i].y-1, 8, 8, this.colour)
      }
    }

    for (let i = 0; i < this.flags.length; i++) {
      if (this.sprites[this.spriteIndex].flags[i] == 0) 
        ICONS["flag-off"].Blit(this.Kernel.DisplayChip, this.flags[i].x, this.flags[i].y)
      else
        ICONS["flag-on"].Blit(this.Kernel.DisplayChip, this.flags[i].x, this.flags[i].y)
    }

    this.Kernel.DisplayChip.Rect(0, this.spritesY-1, 128, 1, 7)
    for (let i = 0; i < this.spriteButtons.length; i++) {
      let sprite = new SpriteChip(this.sprites[this.spriteButtons[i].colour].sprite, 8, 8) 
      sprite.Blit(this.Kernel.DisplayChip, this.spriteButtons[i].x, this.spriteButtons[i].y)
    }

    this.Kernel.DisplayChip.Rect(this.spriteButtons[this.spriteIndex].x, this.spriteButtons[this.spriteIndex].y, 7, 7, 7, true)
  }

  handleKeyPress(key) {
    switch (key.toUpperCase()) {
      case "ARROWRIGHT":
        this.mapIndexX++
        break;

      case "ARROWLEFT":
        this.mapIndexX--
        break;

      case "ARROWUP":
        this.mapIndexY--
        break;

      case "ARROWDOWN":
        this.mapIndexY++
        break;
    }

    //TODO: mapindex needs to be less, drawn from top left hence index of that
    if (this.mapIndexX > 127) this.mapIndexX = 127
    else if (this.mapIndexX < 0) this.mapIndexX = 0

    if (this.mapIndexY > 127) this.mapIndexY = 127
    else if (this.mapIndexY < 0) this.mapIndexY = 0
  }

  HandleInput() {
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

  HandleClick() {
    if (this.Kernel.MouseChip.pressed["left"] || this.Kernel.MouseChip.pressed["right"]) {
      if (this.mapEditor && this.Kernel.MouseChip.y >= 7 && this.Kernel.MouseChip.y <= 95) {
        if (this.Kernel.MouseChip.y > 95 || this.Kernel.MouseChip.y <= 7) return
        let clickX = Math.floor((this.Kernel.MouseChip.x - this.mapX)/8) + this.mapIndexX
        let clickY = Math.floor((this.Kernel.MouseChip.y - this.mapY)/8) + this.mapIndexY

        if (this.Kernel.MouseChip.pressed["left"])
          this.map[clickY][clickX] = this.spriteIndex
        else
          this.map[clickY][clickX] = -1
        return
      }

      for (let i = 0; i < this.pixels.length; i++) {
        if (this.pixels[i].Clicked({x: this.Kernel.MouseChip.x, y: this.Kernel.MouseChip.y})) {
          if (this.Kernel.MouseChip.pressed["left"]) {
            this.sprites[this.spriteIndex].sprite[i] = this.colour
            this.pixels[i].colour = this.colour
          } else {
            this.sprites[this.spriteIndex].sprite[i] = -1
            this.pixels[i].colour = -1
          }
        }
      }

      return
    }

    for (let i = 0; i < this.Kernel.MouseChip.clickBuffer.length; i++) {

      let click = this.Kernel.MouseChip.clickBuffer[i]

      if (this.mapEditor && click.y >= 7 && click.y <= 95) {
        let clickX = Math.floor((click.x - this.mapX)/8) + this.mapIndexX
        let clickY = Math.floor((click.y - this.mapY)/8) + this.mapIndexY
        if (click.button == "left")
          this.map[clickY][clickX] = this.spriteIndex
        else
          this.map[clickY][clickX] = -1
      } else {
        for (let i = 0; i < this.pixels.length; i++) {
          if (this.pixels[i].Clicked(click)) {
            if (click.button == "left") {
              this.sprites[this.spriteIndex].sprite[i] = this.colour
              this.pixels[i].colour = this.colour
          } else {
              this.pixels[i].colour = -1
              this.sprites[this.spriteIndex].sprite[i] = -1
            }
          }
        }

        for (let i = 0; i < this.pallete.length; i++) {
          if (this.pallete[i].Clicked(click)) {
            if (click.button == "left")
              this.colour = this.pallete[i].colour
          }
        }
      }

      for (let i = 0; i < this.flags.length; i++) {
        if (this.flags[i].Clicked(click)) {
          this.sprites[this.spriteIndex].flags[i] = this.sprites[this.spriteIndex].flags[i] == 1 ? 0 : 1
          console.log(this.sprites[this.spriteIndex].flags)
        }
      }

      for (let i = 0; i < this.spriteButtons.length; i++) {
        if (this.spriteButtons[i].Clicked(click)) {
          this.spriteIndex = i
          for (let j = 0; j < this.pixels.length; j++) {
            this.pixels[j].colour = this.sprites[this.spriteButtons[i].colour].sprite[j]
          }
        }
      } 
      
      if (this.switchButton.Clicked(click)) {
        this.mapEditor = !this.mapEditor
      }

      this.Kernel.MouseChip.clickBuffer.pop()
    }
  }

  Save() {
    let fileString = "SPRITES = ["
    for (let i = 0; i < this.sprites.length; i++) {
      fileString += "[" + this.sprites[i].sprite.join(",") + "]"
    }
    fileString += "]"
    let [file, _] = this.Kernel.MemoryChip.FindFile("./" + this.fileName) 
    file.MetaData.Sprites = this.sprites
    file.MetaData.Map = this.map
    file.FileData = fileString
    this.Kernel.Save()
  }
}

module.exports = {
  Sprite
}
