class Interpreter {
  constructor(kernel, programString, lastProgram) {
    this.Kernel = kernel;
    this.lastProgram = lastProgram;
    this.programString = programString;
  }

  Start() {}

  Update() {
    this.Kernel.DisplayChip.FillScreen(7);
    if (this.Kernel.KeyboardChip.isPressed("Escape")) {
      this.Kernel.KeyboardChip.clean();
      this.Kernel.Load(this.lastProgram);
    }
  }

  Interpret() {}
}

module.exports = {
  Interpreter,
};
