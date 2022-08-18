class MouseChip {
  constructor(Kernel, canvas) {
    this.Kernel = Kernel
    this.canvas = canvas
    this.clickBuffer = []
    this.pressed = {"left": false, "right": false, "middle": false,}

    this.x = 0
    this.y = 0

    canvas.addEventListener("mousemove",(e) => {
        this.x = Math.floor(e.offsetX/this.Kernel.DisplayChip.PIXEL_SIZE)
        this.y = Math.floor(e.offsetY/this.Kernel.DisplayChip.PIXEL_SIZE)
    })

    canvas.addEventListener("mousedown", (e) => {
      let keypress = {
        x: Math.floor(e.offsetX/this.Kernel.DisplayChip.PIXEL_SIZE),
        y: Math.floor(e.offsetY/this.Kernel.DisplayChip.PIXEL_SIZE),
      }

      if (e.button == 0) {
        keypress.button = "left"
        this.clickBuffer.push(keypress)
        this.pressed["left"] = true
      } else if (e.button == 2) {
        keypress.button = "right"
        this.clickBuffer.push(keypress)
        this.pressed["right"] = true
      } else {
        this.pressed["middle"] = true
      }
    })

    canvas.addEventListener("mouseup", (e) => {
      switch (e.button) {
        case 0:
          this.pressed["left"] = false
          break;
        case 1:
          this.pressed["middle"] = false
          break;
        case 2:
          this.pressed["right"] = false
          break;
      }
    })
  }
}

module.exports = {
  MouseChip,
}
