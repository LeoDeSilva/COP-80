const { Evaluate } = require("./Evaluator/evaluator.js");
const { CreateEnvironment } = require("./Evaluator/objects.js")

class Interpreter {
  constructor(kernel, AST) {
    this.Kernel = kernel;
    this.AST = AST
    this.Environment = CreateEnvironment()
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
    let [result, evalulatorErr] = Evaluate(this.AST, this.Environment)
    if (evalulatorErr != null) {
      this.error = evalulatorErr.msg
      return
    }
  }
}

module.exports = {
  Interpreter,
};
