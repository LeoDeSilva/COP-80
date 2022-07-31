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

    case TOKENS.IF:
      return If(node, Environment)

    case TOKENS.WHILE:
      return While(node, Environment)

    case TOKENS.BINARY_OP:
      return BinaryOperation(node, Environment)

    case TOKENS.UNARY_OP:
      return UnaryOperation(node, Environment)

    case TOKENS.IDENTIFIER:
      return Identifier(node, Environment)

    case TOKENS.NUMBER:
      return [new Number(node.LineNumber, node.Value), null]

    case TOKENS.STRING:
      return [new String(node.LineNumber, node.Value), null]

    case TOKENS.PROGRAM:
      return Program(node, Environment)
  }

  return [null, new Error("EVAL_ERROR: TOKEN " + node.Type + " NOT IMPLEMENTED")]
}

function While(whileNode, Environment) {
  let [condition,conditionErr] = Evaluate(whileNode.Condition, Environment)
  if (conditionErr != null) return [null, conditionErr]

  // NO CLUE WHY THIS WORKS, WHILE FUNCTIONS AS A INFINITE LOOP (IF INITIALLY TRUE) AND NEVER STOPS
  // THEREFORE BREAK IF NOT SATISFIED IN THE LOOP
  // THIS IS A DISGUSTING PATCH
  let iteration = 0
  while (condition.Value == 1) {
    //BUGGY FIX COZ I DIDNT WANT TO DO ASYNC STUFF
    if (iteration > 10000) return [
      null, 
      new Error("LINE: " + whileNode.LineNumber +" LOOP STALLING PROGRAM, EXCEEDED 10000 ITERATIONS")
    ]
      
    let [, consequenceErr] = Evaluate(whileNode.Consequence, Environment)
    if (consequenceErr != null) return [null, consequenceErr]

    let [satisfied, satisfiedErr] = Evaluate(whileNode.Condition, Environment)
    if (satisfiedErr != null) return [null, satisfiedErr]
    if (satisfied.Value == 0) break;

    iteration++
  }

  return [new Null(), null]
}

function If(ifNode, Environment) {
  let isSatisfied = false
  let index = 0
  while (!isSatisfied && index < ifNode.Conditionals.length) {
    let [condition, conditionErr] = Evaluate(ifNode.Conditionals[index][0], Environment)
    if (conditionErr != null) return [null, conditionErr]

    if (condition.Value == 1) {
      isSatisfied = true
      //TODO  HANDLE returns from functions inside if statements
      let [, evalErr] = Evaluate(ifNode.Conditionals[index][1], Environment)
      if (evalErr != null) return [null, evalErr]
    }
     index++
  }

  if (!isSatisfied) {
    let [, evalErr] = Evaluate(ifNode.Alternative, Environment)
    if (evalErr != null) return [null, evalErr]
  }

  return [new Null(), null]
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
