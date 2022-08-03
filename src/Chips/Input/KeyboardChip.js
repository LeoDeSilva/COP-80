class KeyboardChip {
  constructor() {
    // LIST OF ALL KEYS WAITING TO BE HANDLED (compensate for speed difference)
    this.keyBuffer = [];
    this.pressedKeys = {};

    window.addEventListener("keyup", (e) => {
      this.pressedKeys[e.key] = false;
    });
    window.addEventListener("keydown", (e) => {
      // ON KEY DOWN: SHOW CURRENTLY HELD DOWN KEYS, and ADD TO BUFFER
      this.pressedKeys[e.key] = true;
      this.keyBuffer.push(e.key);
    });
  }

  isPressed(key) {
    let pressed = this.pressedKeys[key];
    if (pressed == undefined) pressed = false
    return pressed ? 1 : 0
  }

  handleKey() {
    this.keyBuffer.pop();
  }

  clean() {
    this.keyBuffer = [];
  }
}

module.exports = {
  KeyboardChip,
};
