class KeyboardChip {
  constructor() {
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
    return this.pressedKeys[key];
  }

  handleKey() {
    this.keyBuffer.pop();
  }
}

module.exports = {
  KeyboardChip,
};
