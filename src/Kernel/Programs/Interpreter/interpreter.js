const { Evaluate } = require("./Evaluator/evaluator.js");
const { CreateEnvironment } = require("./Evaluator/objects.js")
const { InvokeNode, IdentifierNode } = require("./Parser/nodes.js")
const { TOKENS } = require("./Lexer/tokens")

class Interpreter {
  constructor(kernel, env) { // AST
    this.Kernel = kernel;
    this.Environment = env
    //this.AST = AST
    //this.Environment = CreateEnvironment()
    this.error = "";
  }

  Start() {
    this.Kernel.DisplayChip.FillScreen(0);

    if (!this.Environment.Global["_START"]) return
    if (this.Environment.Global["_START"] || this.Environment.Global["_START"].Type == TOKENS.FUNCTION) {
      let invokeNode = new InvokeNode(0, new IdentifierNode(0, "_START"), [])
        //return [new InvokeNode(this.lineNumber, node, args), null]
      //let [result, resultErr] = Evaluate(this.Environment.Global["_UPDATE"], this.Environment)
      let [result, resultErr] = Evaluate(invokeNode, this.Environment)
      if (resultErr != null) {
        this.error = resultErr.msg
        return
      }
    }
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

      this.Quit()
    }

    let invokeNode = new InvokeNode(0, new IdentifierNode(0, "_UPDATE"), [])
      //return [new InvokeNode(this.lineNumber, node, args), null]
    //let [result, resultErr] = Evaluate(this.Environment.Global["_UPDATE"], this.Environment)
    let [result, resultErr] = Evaluate(invokeNode, this.Environment)
    if (resultErr != null) {
      this.error = resultErr.msg
      return
    }

    this.Kernel.KeyboardChip.Update()
  }

  Quit() {
    this.Kernel.KeyboardChip.clean();
    this.Kernel.Resume(this.Kernel.lastProgram);
  }


  Interpret() {
    //let [result, evalulatorErr] = Evaluate(this.AST, this.Environment)
    //if (evalulatorErr != null) {
      //this.error = evalulatorErr.msg
      //return
    //}
  }
}


module.exports = {
  Interpreter,
};
