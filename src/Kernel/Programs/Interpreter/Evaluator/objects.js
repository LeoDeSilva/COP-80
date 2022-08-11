const { TOKENS, Error } = require("../Lexer/tokens.js")

function CreateEnvironment(Kernel) {
  return new Environment(Kernel)
}

// Store variables, functions etc. - refresh every program run
class Environment {
  constructor(Kernel) {
    this.Global = {
      TRUE: new Number(1),
      FALSE: new Number(0),
      DT: new Number(1/30),
    }
    this.Local = {}
    this.Kernel = Kernel
  }
}

//Wrapper for all objects
class Object {
  constructor(Type) {
    this.Type = Type
  }
}

class Table extends Object {
  constructor(Table) {
    super(TOKENS.TABLE)
    this.Table = Table
  }
}

class Array extends Object {
  constructor(Elements) {
    super(TOKENS.ARRAY)
    this.Elements = Elements
  }
}

class Predefined extends Object {
  constructor(Fn) {
    super(TOKENS.PREDEFINED)
    this.Fn = Fn
  }
}

class Null extends Object {
  constructor(LineNumber) {
    super(TOKENS.NULL)
  }
}

class Return extends Object {
  constructor(Expression) {
    super(TOKENS.RETURN)
    this.Expression = Expression
  }
}

class Function extends Object {
  constructor(Parameters, Body) {
    super(TOKENS.FUNCTION)
    this.Parameters = Parameters
    this.Body = Body
  }
}

// Wrapper for base types that can undergo operations (e.g. String or Integer)
class Atom extends Object {
  constructor(Type, Value) {
    super(Type)
    this.Value = Value
  }

  //produce raw data output e.g. "10" or 30 (to be wrapped in specific Atom Object)
  RawUnaryOperation(operation) {
    let [result, err] = [null, null]
    switch (operation) {
      case TOKENS.SUB:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error("Line " + Right.LineNumber + " CANNOT NEGATE STRING")
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
            "Line " + Right.LineNumber + " CANNOT SUBTRACT STRINGS: " 
            + this.Value + " - " + Right.Value)
          break
        }
        result = this.Value - Right.Value
        break;
      case TOKENS.MUL:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error(
            "Line " + Right.LineNumber + " CANNOT MULTIPLY STRINGS: " 
            + this.Value + " * " + Right.Value)
          break
        }
        result = this.Value * Right.Value
        break;
      case TOKENS.DIV:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error(
            "Line " + Right.LineNumber + " CANNOT DIVIDE STRINGS: " 
            + this.Value + " / " + Right.Value)
          break
        }
        result = this.Value / Right.Value
        break;

      case TOKENS.MOD:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error(
            "Line " + Right.LineNumber + " CANNOT MODULO STRING: " 
            + this.Value + " % " + Right.Value)
          break
        }
        result = this.Value % Right.Value
        break;
      case TOKENS.POW:
        if (this.Type != TOKENS.NUMBER) {
          err = new Error(
            "Line " + Right.LineNumber + " CANNOT USE STRING AS EXPONENTIAL: " 
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
        result = this.Value < Right.Value ? 1 : 0
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

      case TOKENS.AND:
        result = (this.Value == 1 && Right.Value == 1) ? 1 : 0
        break;

      case TOKENS.OR:
        result = (this.Value == 1 || Right.Value == 1) ? 1 : 0
        break;
    }
    return [result, err]
  }
}

class String extends Atom {
  constructor(Value) {
    super(TOKENS.STRING, Value)
  }

  UnaryOperation(operation) { // wrapper for RawUnaryOperation
    let [result, err] = super.RawUnaryOperation(operation)
    if (err != null) return [null, err]
    return [new String(result), null]
  }

  BinaryOperation(operation, Right) {
    let [result, err] = super.RawBinaryOperation(operation, Right)
    if (err != null) return [null, err]
    return [new String(result), null]
  }
}

class Number extends Atom {
  constructor(Value) {
    super(TOKENS.NUMBER, Value)
  }

  UnaryOperation(operation) {
    let [result, err] = super.RawUnaryOperation(operation)
    if (err != null) return [null, err]
    return [new Number(result), null]
  }

  BinaryOperation(operation, Right) {
    let [result, err] = super.RawBinaryOperation(operation, Right)
    if (err != null) return [null, err]

    // parseFloat(result.toFixed(12)) deals with the nasty floating point math by effectively rounding 10.299999999999999999999 to 10.3
    // however this means it can only deal with floating points up to 12 digits
    return [new Number(parseFloat(result.toFixed(12))), null]
  }
}

module.exports = {
  CreateEnvironment,
  Number,
  String,
  Function,
  Array,
  Return,
  Table,
  Predefined,
  Null,
}
