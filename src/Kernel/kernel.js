const { MemoryChip } = require("../Chips/MemoryChip");
const { DisplayChip } = require("../Chips/Display/DisplayChip");
const { KeyboardChip } = require("../Chips/Input/KeyboardChip");
const { FontChip } = require("../Chips/Display/FontChip");
const { ErrorChip } = require("../Chips/ErrorChip");

const { Terminal } = require("./Programs/Terminal/Terminal");

const { FONT } = require("../Assets/font");
const { ICONS } = require("../Assets/icons");

class Kernel {
  constructor(screenHeight) {
    this.Icons = ICONS;

    this.MemoryChip = new MemoryChip();
    this.DisplayChip = new DisplayChip(screenHeight);
    this.KeyboardChip = new KeyboardChip();
    this.FontChip = new FontChip(FONT);

    this.loadedProgram = new Terminal(this);
    this.loadedProgram.Start();
  }

  Update() {
    this.loadedProgram.Update();
    this.DisplayChip.Draw();
  }

  Load(program) {
    this.loadedProgram = program;
    this.loadedProgram.Start();
  }
}

module.exports = {
  Kernel,
};
