const { TOKENS, Error } = require("../Lexer/tokens.js")

function CreateEnvironment() {
  return new Environment()
}


// Store variables, functions etc. - refresh every program run
class Environment {
  constructor() {
    this.Global = {}
    this.Local = {}
    this.Functions = {}
  }
}

//Wrapper for all objects
class Object {
  constructor(LineNumber, Type) {
    this.LineNumber = LineNumber
    this.Type = Type
  }
}

class Null extends Object {
  constructor(LineNumber) {
    super(LineNumber, TOKENS.NULL)
  }
}

// Wrapper for base types that can undergo operations (e.g. String or Integer)
class Atom extends Object {
  constructor(LineNumber, Type, Value) {
    super(LineNumber, Type)
    this.Value = Value
  }

  //produce raw data output e.g. "10" or 30 (to be wrapped in specific Atom Object)
  RawUnaryOperation(operation) {
    let [result, err] = [null, null]
    switch (operation) {
      case TOKENS.SUB:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error("Line " + this.LineNumber + " CANNOT NEGATE STRING")
          break
        }

        result = -this.Value
        break;

      case TOKENS.BANG:
        result = this.Value == 0 ? 1 : 0 // convert boolean into integer
        break;
    }

    return [result, err]
  }

  //raw data output (wrapped in individual objects)
  RawBinaryOperation(operation, Right) {
    let [result, err] = [null, null]
    switch (operation) {
      case TOKENS.ADD:
        result = this.Value + Right.Value
        break;
      case TOKENS.SUB:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error(
            "Line " + this.LineNumber + " CANNOT SUBTRACT STRINGS: " 
            + this.Value + " - " + Right.Value)
          break
        }
        result = this.Value - Right.Value
        break;
      case TOKENS.MUL:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error(
            "Line " + this.LineNumber + " CANNOT MULTIPLY STRINGS: " 
            + this.Value + " * " + Right.Value)
          break
        }
        result = this.Value * Right.Value
        break;
      case TOKENS.DIV:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error(
            "Line " + this.LineNumber + " CANNOT DIVIDE STRINGS: " 
            + this.Value + " / " + Right.Value)
          break
        }
        result = this.Value / Right.Value
        break;

      case TOKENS.MOD:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error(
            "Line " + this.LineNumber + " CANNOT MODULO STRING: " 
            + this.Value + " % " + Right.Value)
          break
        }
        result = this.Value % Right.Value
        break;
      case TOKENS.POW:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error(
            "Line " + this.LineNumber + " CANNOT USE STRING AS EXPONENTIAL: " 
            + this.Value + " ^ " + Right.Value)
          break
        }
        result = this.Value ** Right.Value
        break;


      // for comparisons (convert bool value into integer)
      case TOKENS.EE:
        result = this.Value == Right.Value ? 1 : 0
        break;
      case TOKENS.NE:
        result = this.Value != Right.Value ? 1 : 0
        break;
      case TOKENS.LT:
        result = this.Value > Right.Value ? 1 : 0
        break;
      case TOKENS.LTE:
        result = this.Value <= Right.Value ? 1 : 0
        break;
      case TOKENS.GT:
        result = this.Value > Right.Value ? 1 : 0
        break;
      case TOKENS.GTE:
        result = this.Value >= Right.Value ? 1 : 0
        break;
    }
    return [result, err]
  }
}

class String extends Atom {
  constructor(LineNumber, Value) {
    super(LineNumber, TOKENS.STRING, Value)
  }

  UnaryOperation(operation) { // wrapper for RawUnaryOperation
    let [result, err] = super.RawUnaryOperation(operation)
    if (err != null) return [null, err]
    return [new String(this.LineNumber, result), null]
  }

  BinaryOperation(operation, Right) {
    let [result, err] = super.RawBinaryOperation(operation, Right)
    if (err != null) return [null, err]
    return [new String(this.LineNumber, result), null]
  }
}

class Number extends Atom {
  constructor(LineNumber, Value) {
    super(LineNumber, TOKENS.NUMBER, Value)
  }

  UnaryOperation(operation) {
    let [result, err] = super.RawUnaryOperation(operation)
    if (err != null) return [null, err]
    return [new Number(this.LineNumber, result), null]
  }

  BinaryOperation(operation, Right) {
    let [result, err] = super.RawBinaryOperation(operation, Right)
    if (err != null) return [null, err]
    return [new Number(this.LineNumber, result), null]
  }
}

module.exports = {
  CreateEnvironment,
  Number,
  String,
  Null,
}
