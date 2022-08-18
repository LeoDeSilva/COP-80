const {SpriteChip} = require("../../../Chips/Display/SpriteChip.js")

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
  constructor(Kernel, fileName, sprites) {
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

    this.mapEditor = false
    
    for (let i = 0; i < this.pixels.length; i++) {
      this.pixels[i].colour = this.sprites[this.spriteButtons[this.spriteIndex].colour][i]
    }
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

    this.Kernel.DisplayChip.FillScreen(0);

    this.Kernel.DisplayChip.Rect(0, 0, 128, 7, 7);
    this.Kernel.FontChip.BlitText(
      this.Kernel.DisplayChip,
      this.fileName,
      1,
      1,
      0,
    );


    this.Kernel.DisplayChip.Rect(0, this.spritesY-1, 128, 1, 7)
    for (let i = 0; i < this.spriteButtons.length; i++) {
      let sprite = new SpriteChip(this.sprites[this.spriteButtons[i].colour], 8, 8) 
      sprite.Blit(this.Kernel.DisplayChip, this.spriteButtons[i].x, this.spriteButtons[i].y)
    }

    this.Kernel.DisplayChip.Rect(this.spriteButtons[this.spriteIndex].x, this.spriteButtons[this.spriteIndex].y, 7, 7, 7, true)

  }

  PixelArtUpdate() {
    if (this.Kernel.loadedProgram != this) return;
    console.log(this.Kernel.KeyboardChip.pressedKeys)

    if (this.Kernel.KeyboardChip.isPressed("Escape")) {
        this.Save();
        this.Kernel.Resume(this.Kernel.lastProgram);
    }// else if (this.Kernel.KeyboardChip.isPressed("M") || this.Kernel.KeyboardChip.isPressed("S")) {
     // this.mapEditor = true
   // }

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

    this.Kernel.DisplayChip.Rect(this.pixelsX-1, this.pixelsY-1, 66, 66, 7)
    for (let i = 0; i < this.pixels.length; i++) {
      this.pixels[i].Draw()
    }

    this.Kernel.DisplayChip.Rect(this.palleteX-1, this.palleteY-1, 34, 34, 7)
    for (let i = 0; i < this.pallete.length; i++) {
      this.pallete[i].Draw()
      if (i == this.colour) {
        this.Kernel.DisplayChip.Rect(this.pallete[i].x, this.pallete[i].y, 8, 8, 0)
        this.Kernel.DisplayChip.Rect(this.pallete[i].x-1, this.pallete[i].y-1, 8, 8, this.colour)
      }
    }

    this.Kernel.DisplayChip.Rect(0, this.spritesY-1, 128, 1, 7)
    for (let i = 0; i < this.spriteButtons.length; i++) {
      let sprite = new SpriteChip(this.sprites[this.spriteButtons[i].colour], 8, 8) 
      sprite.Blit(this.Kernel.DisplayChip, this.spriteButtons[i].x, this.spriteButtons[i].y)
    }

    this.Kernel.DisplayChip.Rect(this.spriteButtons[this.spriteIndex].x, this.spriteButtons[this.spriteIndex].y, 7, 7, 7, true)
  }

  HandleClick() {
    if (this.Kernel.MouseChip.pressed["left"] || this.Kernel.MouseChip.pressed["right"]) {
      for (let i = 0; i < this.pixels.length; i++) {
        if (this.pixels[i].Clicked({x: this.Kernel.MouseChip.x, y: this.Kernel.MouseChip.y})) {
          if (this.Kernel.MouseChip.pressed["left"]) {
            this.sprites[this.spriteIndex][i] = this.colour
            this.pixels[i].colour = this.colour
          } else {
            this.sprites[this.spriteIndex][i] = -1
            this.pixels[i].colour = -1
          }
        }
      }
      return
    }

    for (let i = 0; i < this.Kernel.MouseChip.clickBuffer.length; i++) {

      let click = this.Kernel.MouseChip.clickBuffer[i]

      for (let i = 0; i < this.pixels.length; i++) {
        if (this.pixels[i].Clicked(click)) {
          if (click.button == "left") {
            this.sprites[this.spriteIndex][i] = this.colour
            this.pixels[i].colour = this.colour
          } else {
            this.pixels[i].colour = -1
            this.sprites[this.spriteIndex][i] = -1
          }
        }
      }

      for (let i = 0; i < this.pallete.length; i++) {
        if (this.pallete[i].Clicked(click)) {
          if (click.button == "left")
            this.colour = this.pallete[i].colour
        }
      }

      for (let i = 0; i < this.spriteButtons.length; i++) {
        if (this.spriteButtons[i].Clicked(click)) {
          this.spriteIndex = i
          for (let j = 0; j < this.pixels.length; j++) {
            this.pixels[j].colour = this.sprites[this.spriteButtons[i].colour][j]
          }
        }
      } 
      
      this.Kernel.MouseChip.clickBuffer.pop()
    }
  }

  Save() {
    let fileString = "SPRITES = ["
    for (let i = 0; i < this.sprites.length; i++) {
      fileString += "[" + this.sprites[i].join(",") + "]"
    }
    fileString += "]"
    let [file, _] = this.Kernel.MemoryChip.FindFile("./" + this.fileName) 
    file.MetaData.Sprites = this.sprites
    file.FileData = fileString
    this.Kernel.Save()
  }
}

module.exports = {
  Sprite
}
