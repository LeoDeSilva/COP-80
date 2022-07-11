const { Error } = require("./Lexer/tokens");
const { Lexer } = require("./Lexer/lexer");

class Interpreter {
  constructor(kernel, programString) {
    this.Kernel = kernel;
    this.programString = programString;
    this.error = "";
  }

  Start() {
    this.Kernel.DisplayChip.FillScreen(0);
    this.Interpret();
  }

  Update() {
    if (this.Kernel.loadedProgram != this) return;

    if (this.Kernel.KeyboardChip.isPressed("Escape") || this.error != "") {
      if (this.error != "") {
        // assuming lastProgram is terminal, if providing errors, assign permentant terminal to kernel
        this.Kernel.lastProgram.History.push({
          type: "string",
          content: this.error,
          colour: 14,
        });
      }
      this.Kernel.KeyboardChip.clean();
      this.Kernel.Resume(this.Kernel.lastProgram);
    }
  }

  Interpret() {
    let lexer = new Lexer(this.programString);
    let tokens,
      err = lexer.Lex();

    if (err != null) {
      this.error = err.msg;
    }
  }
}

module.exports = {
  Interpreter,
};
