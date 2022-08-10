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
    console.log(this.Get())
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
    this.MemoryChip.BaseDirectory.Files = JSON.parse(localStorage.getItem("Files"))
    this.MemoryChip.BaseDirectory.SubDirs = JSON.parse(localStorage.getItem("Dirs"))
    this.MemoryChip.BaseDirectory.Parent = this.MemoryChip.BaseDirectory;

    this.MemoryChip.CurrentDirectory = this.MemoryChip.BaseDirectory;
    this.MemoryChip.FilePath = [this.MemoryChip.BaseDirectory];

    console.log(this.MemoryChip)
  }
}


function parseDataFile(filePath, defaults) {
  // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
  // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(error) {
    // if there was some kind of error, return the passed in defaults instead.
    return defaults;
  }
}

module.exports = {
  Kernel,
};

