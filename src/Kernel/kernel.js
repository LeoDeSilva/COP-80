const { MemoryChip } = require("../Chips/MemoryChip");
const { DisplayChip } = require("../Chips/Display/DisplayChip");
const { KeyboardChip } = require("../Chips/Input/KeyboardChip");
const { FontChip } = require("../Chips/Display/FontChip");
const { ErrorChip } = require("../Chips/ErrorChip");

const { Terminal } = require("./Programs/Terminal/Terminal");

const { FONT } = require("../Assets/font");
const { ICONS } = require("../Assets/icons");

const electron = require('electron');
const path = require('path');
const fs = require('fs');

class Kernel {
  constructor(screenHeight) {
    this.Icons = ICONS;

    this.MemoryChip = new MemoryChip(this);
    this.DisplayChip = new DisplayChip(screenHeight);
    this.KeyboardChip = new KeyboardChip();
    this.FontChip = new FontChip(FONT);

    this.loadedProgram = new Terminal(this);
    this.loadedProgram.Start();

    this.ParseSave()
  }

  Update() {
    this.loadedProgram.Update();
    this.DisplayChip.Draw();
  }

  Resume(program) {
    this.loadedProgram = program;
  }

  Load(program) {
    this.loadedProgram = program;
    this.loadedProgram.Start();
  }
  
  Save() {
    localStorage.setItem("Files", JSON.stringify(this.MemoryChip.BaseDirectory.Files))
    localStorage.setItem("Dirs", JSON.stringify(this.MemoryChip.BaseDirectory.SubDirs))
  }

  Get() {
    return [JSON.parse(localStorage.getItem("Files")), JSON.parse(localStorage.getItem("Dirs"))]
  }

  ParseSave() {
    if (this.Get()[0] == null || this.Get()[1] == null) return
    this.MemoryChip.BaseDirectory.Files = JSON.parse(localStorage.getItem("Files"))
    this.MemoryChip.BaseDirectory.SubDirs = JSON.parse(localStorage.getItem("Dirs"))

    this.MemoryChip.CurrentDirectory = this.MemoryChip.BaseDirectory;
    this.MemoryChip.Path = ["/"];

  }
}

module.exports = {
  Kernel,
};

