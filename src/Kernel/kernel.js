const { MemoryChip } = require("../Chips/MemoryChip");
const { DisplayChip } = require("../Chips/Display/DisplayChip");
const { KeyboardChip } = require("../Chips/Input/KeyboardChip");
const { MouseChip } = require("../Chips/Input/MouseChip");
const { FontChip } = require("../Chips/Display/FontChip");
const { ErrorChip } = require("../Chips/ErrorChip");

const { Terminal } = require("./Programs/Terminal/Terminal");

const { FONT } = require("../Assets/font");
const { ICONS } = require("../Assets/icons");

const electron = require('electron');
const path = require('path');
const fs = require('fs');

class Kernel {
  constructor(screenHeight, canvas) {
    this.Icons = ICONS;

    this.MemoryChip = new MemoryChip(this);
    this.DisplayChip = new DisplayChip(screenHeight);
    this.KeyboardChip = new KeyboardChip();
    this.FontChip = new FontChip(FONT);
    this.MouseChip = new MouseChip(this, canvas);

    this.loadedProgram = new Terminal(this);
    this.loadedProgram.Start();

    this.ParseSave()
    if (!this.MemoryChip.FindDir(this.MemoryChip.BaseDirectory, ".MODULES"))
      this.LoadModules()
  }

  LoadModules() {
    this.MemoryChip.CreateDirectory(".MODULES")
    this.MemoryChip.ChangeDirectory(".MODULES")
    this.MemoryChip.CreateFile("SPRITE.COP", "FN NEW_SPRITE(X, Y, W, H, C) GO\n\tRETURN {\n\t\tX: X,\t\n\t\tY: Y,\n\t\tW: W,\n\t\tH: H,\n\t\tC: C,\n\t}\nEND\n\nFN DRAW_SPRITE(S) GO\n\tRECT(S.X, S.Y, S.W, S.H, S.C)\nEND\n\nFN INTERSECT(S1, S2) GO\n\tL1 = [S1.X, S1.Y]\n\tR1 = [S1.X+S1.W, S1.Y+S1.H]\n\n\tL2 = [S2.X, S2.Y]\n\tR2 = [S2.X+S2.W, S2.Y+S2.H]\n\t\n\tIF L1[0] == R1[0] OR L1[1] == R1[1] OR L2[0] == R2[0] OR L2[1] == R2[1] THEN\n\t\tRETURN FALSE\n\tEND\n\n\tIF L1[0] > R2[0] OR L2[0] > R1[0] THEN\n\t\tRETURN FALSE\n\tEND\n\n\tIF R1[1] < L2[1] OR R2[1] < L1[1] THEN\n\t\tRETURN FALSE\n\tEND\n\tRETURN TRUE\nEND")
    this.MemoryChip.ChangeDirectory("..")
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

