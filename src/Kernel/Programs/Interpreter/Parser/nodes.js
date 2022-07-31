const { TOKENS, Error, Token, LETTERS, DIGITS } = require("../Lexer/tokens");

const PREFERENCES = {
  AND: 5,
  OR: 5,
  EE: 10,
  NE: 10,
  GT: 10,
  LT: 10,
  GTE: 10,
  LTE: 10,
  MOD: 15,
  ADD: 20,
  SUB: 20,
  MUL: 30,
  DIV: 30,
  POW: 40,
  LPAREN: 0,
  NEW_LINE: -1,
};

// To ensure parsing of binary operations only allows specific tokens
const BIN_OPERATIONS = [
  TOKENS.AND,
  TOKENS.OR,
  TOKENS.EE,
  TOKENS.NE,
  TOKENS.LT,
  TOKENS.LTE,
  TOKENS.GT,
  TOKENS.GTE,
  TOKENS.ADD,
  TOKENS.SUB,
  TOKENS.MUL,
  TOKENS.DIV,
  TOKENS.MOD,
  TOKENS.POW,
];

class Node {
  constructor(LineNumber, Type) {
    this.LineNumber = LineNumber;
    this.Type = Type;
  }
}

// root node of AST (contains a list of all nodes)
class ProgramNode extends Node {
  constructor(LineNumber, Nodes) {
    super(LineNumber, TOKENS.PROGRAM);
    this.Nodes = Nodes;
  }
}

class WhileNode extends Node {
  constructor(LineNumber, Condition, Consequence) {
    super(LineNumber, TOKENS.WHILE)
    this.Condition = Condition
    this.Consequence = Consequence
  }
}

class IfNode extends Node {
  constructor(LineNumber) {
    super(LineNumber, TOKENS.IF)
    this.Conditionals = []
    this.Alternative = null
  }
}

class AssignNode extends Node {
  constructor(LineNumber, Scope, Left, Right) {
    super(LineNumber, TOKENS.ASSIGN)
    this.Scope = Scope
    this.Left = Left
    this.Right = Right
  }
}

class NumberNode extends Node {
  constructor(LineNumber, Value) {
    super(LineNumber, TOKENS.NUMBER);
    this.Value = Value;
  }
}

class StringNode extends Node {
  constructor(LineNumber, Value) {
    super(LineNumber, TOKENS.STRING);
    this.Value = Value
  }
}

class IdentifierNode extends Node {
  constructor(LineNumber, Identifier) {
    super(LineNumber, TOKENS.IDENTIFIER)
    this.Identifier = Identifier
  }
}

class BinaryOperationNode extends Node {
  constructor(LineNumber, Left, Op, Right) {
    super(LineNumber, TOKENS.BINARY_OP);
    this.Left = Left;
    this.Op = Op;
    this.Right = Right;
  }
}

class UnaryOperationNode extends Node {
  constructor(LineNumber, Op, Right) {
    super(LineNumber, TOKENS.UNARY_OP);
    this.Op = Op;
    this.Right = Right;
  }
}

module.exports = {
  ProgramNode,
  NumberNode,
  StringNode,
  IdentifierNode,
  AssignNode,
  BinaryOperationNode,
  UnaryOperationNode,
  IfNode,
  PREFERENCES,
  BIN_OPERATIONS,
  WhileNode,
};
