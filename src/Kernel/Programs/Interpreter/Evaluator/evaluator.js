const { TOKENS, Error, Token } = require("../Lexer/tokens");

const {
  Number,
  String,
  Null,
} = require("./objects.js");

// recursive evaluation of program
function Evaluate(node, Environment) {
  switch (node.Type) {
    case TOKENS.ASSIGN:
      return Assign(node, Environment)
      break;

    case TOKENS.BINARY_OP:
      return BinaryOperation(node, Environment)
      break;

    case TOKENS.UNARY_OP:
      return UnaryOperation(node, Environment)

    case TOKENS.IDENTIFIER:
      return Identifier(node, Environment)

    case TOKENS.NUMBER:
      return [new Number(node.LineNumber, node.Value), null]
      break;

    case TOKENS.STRING:
      return [new String(node.LineNumber, node.Value), null]

    case TOKENS.PROGRAM:
      return Program(node, Environment)
      break;
  }

  return [null, null]
}

function Identifier(identifierNode, Environment) {
  let [value, err] = [null, null]

  if (Environment.Local[identifierNode.Identifier] != null) {
    value = Environment.Local[identifierNode.Identifier]

  } else if (Environment.Global[identifierNode.Identifier] != null) {
    value = Environment.Global[identifierNode.Identifier]

  } else {
    err = new Error(
      "LINE " + identifierNode.LineNumber 
      + ", NO VARIABLE EXISTS WITH NAME: " + identifierNode.Identifier
    )
  }

  return [value, err]
}

function Assign(assignNode, Environment) {
  let [Right, RightErr] = Evaluate(assignNode.Right, Environment)
  if (RightErr != null) return [null, RightErr]

  if (assignNode.Left.Type == TOKENS.IDENTIFIER) {
    if (assignNode.Scope == TOKENS.LOCAL) {
      Environment.Local[assignNode.Left.Identifier] = Right
    } else {
      Environment.Global[assignNode.Left.Identifier] = Right
    }
  }

  return [new Null(assignNode.LineNumber), null]
}

// evaluate all sub nodes and return last value
function Program(programNode, Environment) {
  let [result, err] = [null, null]
  for (let i = 0; i < programNode.Nodes.length; i++) {
    [result, err] = Evaluate(programNode.Nodes[i], Environment)
    if (err != null) return [null, err]
    if (result.Type != TOKENS.NULL) console.log(result)
    
  }
  return [result, err]
}

function UnaryOperation(unaryNode, Environment) {
  let [Right, rightErr] = Evaluate(unaryNode.Right, Environment)
  if (rightErr != null) return [null, rightErr]

  return Right.UnaryOperation(unaryNode.Op)
}

function BinaryOperation(binaryNode, Environment) {
  let [result, err] = [null, null]
  
  // evaluate each side of the operation
  let [Left, leftErr] = Evaluate(binaryNode.Left, Environment)
  if (leftErr != null) return [null, leftErr]

  let [Right, rightErr] = Evaluate(binaryNode.Right, Environment)
  if (rightErr != null) return [null, rightErr]

  if (Left.Type == Right.Type) { // to ensure no type collsisions
    [result, err] = Left.BinaryOperation(binaryNode.Op, Right)
  } else {
    err = new Error("LINE " + binaryNode.LineNumber + " CANNOT " + binaryNode.Op + " TYPES: " + Left.Type + " AND " + Right.Type)
  }

  return [result, err]
}

module.exports = {
  Evaluate
}
