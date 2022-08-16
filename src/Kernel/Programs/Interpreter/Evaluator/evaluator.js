const { TOKENS, Error, Token } = require("../Lexer/tokens");eval
const { PREDEFINED_FUNCTIONS } = require("./predefined.js")
const { Lexer } = require("../Lexer/lexer");
const { Parser } = require("../Parser/parser");

const {
  Number,
  Function,
  String,
  Array,
  Table,
  CreateEnvironment,
  Return,
  Null,
} = require("./objects.js");

// recursive evaluation of program
function Evaluate(node, Environment) {
  switch (node.Type) {
    case TOKENS.IMPORT:
      return Import(node, Environment)

    case TOKENS.ASSIGN:
      return Assign(node, Environment)

    case TOKENS.IF:
      return If(node, Environment)

    case TOKENS.FUNCTION:
      return FunctionDeclaration(node, Environment)
    
    case TOKENS.INVOKE:
      return Invoke(node, Environment)

    case TOKENS.WHILE:
      return While(node, Environment)

    case TOKENS.FOR:
      return For(node, Environment)

    case TOKENS.BINARY_OP:
      return BinaryOperation(node, Environment)

    case TOKENS.UNARY_OP:
      return UnaryOperation(node, Environment)

    case TOKENS.IDENTIFIER:
      return Identifier(node, Environment)

    case TOKENS.RETURN:
      return ReturnWrapper(node, Environment)

    case TOKENS.ARRAY:
      return evalArray(node, Environment)

    case TOKENS.INDEX:
      return evalIndex(node, Environment)

    case TOKENS.TABLE:
      return evalTable(node, Environment)

    case TOKENS.NUMBER:
      return [new Number(node.Value), null]

    case TOKENS.STRING:
      return [new String(node.Value), null]

    case TOKENS.PROGRAM:
      return Program(node, Environment)
  }

  return [null, new Error("EVAL_ERROR LINE " + node.LineNumber + ", TOKEN " + node.Type + " NOT IMPLEMENTED")]
}

function Import(importNode, Environment) {
  let fileObj = null
  if (importNode.Path.split(".").length > 1 && importNode.Path.split(".")[importNode.Path.split(".").length - 1] == "COP") {
    let initPath = Environment.Kernel.MemoryChip.Path
    let [file, err] = Environment.Kernel.MemoryChip.FindFile(importNode.Path)
    if (err != null) return [null, new Error(err)]
    fileObj = file
  } else {
    let parsedPath = Environment.Kernel.MemoryChip.parsePath(importNode.Path)
    let path = "/.MODULES/" + parsedPath[parsedPath.length - 1] + ".COP"
    let [file, err] = Environment.Kernel.MemoryChip.FindFile(path)
    if (err != null) return [null, new Error(err)]
    fileObj = file
  }

  let lexer = new Lexer(fileObj.FileData);
  let [tokens, lexerErr] = lexer.Lex(false);
  if (lexerErr != null) return [null,new Error(fileObj.FileName + ":" + lexerErr.msg)]

  tokens = tokens.filter(function(tok) {
    return !(["SPACE", "TAB"].includes(tok.Type))
  })

  let parser = new Parser(tokens);
  let [ast, parserErr] = parser.Parse();
  if (parserErr != null) return [null, new Error(fileObj.FileName + ":" + parserErr.msg)]

  let env = CreateEnvironment(Environment.Kernel)
  let [result, evaluatorErr] = Evaluate(ast, env)
  if (evaluatorErr != null) return [null, new Error(fileObj.FileName + ":" + evaluatorErr.msg)]

  for (let key in env.Global) {
    Environment.Global[key] = env.Global[key]
  }

  return [new Null(), null]
}

function For(forNode, Environment) {
  let [expr, exprErr] = Evaluate(forNode.Expression, Environment)
  if (exprErr != null) return [null, exprErr]

  let looper = null
  if (expr.Type == TOKENS.STRING) {
    looper = expr.Value 
  } else if (expr.Type == TOKENS.ARRAY) {
    looper = expr.Elements
  } else {
    return [
      null,
      new Error("LINE " + forNode.LineNumber + " CANNOT LOOP OVER TYPE: " + expr.Type)
    ]
  }

  let index = 0
  while (index < looper.length) {
    if (expr.Type == TOKENS.STRING) 
      Environment.Local[forNode.Identifier] = new String(looper[index])
    else
        Environment.Local[forNode.Identifier] = looper[index]

    let [body, bodyErr] = Evaluate(forNode.Body, Environment)
    if (bodyErr != null) return [null, bodyErr]
    if (body.Type == TOKENS.RETURN) return [body, null]
    
    index++
  }

  return [new Null(), null]
}

function evalIndex(arrayNode, Environment) {
  let [left, leftErr] = Evaluate(arrayNode.Left, Environment)
  if (leftErr != null) return [null, leftErr]

  if (![TOKENS.TABLE, TOKENS.ARRAY].includes(left.Type)) return [
    null,
    new Error("LINE " + arrayNode.LineNumber + " CANNOT INDEX TYPE " + left.Type),
  ]
  
  if (left.Type == TOKENS.ARRAY) {
    let [index, indexErr] = Evaluate(arrayNode.Index, Environment)
    if (indexErr != null) return [null, indexErr]

    if (index.Type != TOKENS.NUMBER) return [
      null,
      new Error("LINE " + arrayNode.LineNumber + " INDEX MUST BE OF TYPE NUMBER, GOT: " + index.Type),
    ]

    if (index.Value >= left.Elements.length) return [
      null,
      new Error("LINE " + arrayNode.LineNumber + " INDEX ERROR: INDEX OUT OF RANGE"),
    ]
    
    return [left.Elements[index.Value], null]

  } else {
    let indexString = ""

    if (arrayNode.Index.Type == TOKENS.IDENTIFIER) indexString = arrayNode.Index.Identifier
    else {
      let [index, indexErr] = Evaluate(arrayNode.Index, Environment)
      if (indexErr != null) return [null, indexErr]

      switch (index.Type) {
        case TOKENS.NUMBER:
          indexString = index.Value.toString()
          break

        case TOKENS.STRING:
          //indexString = index.Value.slice(1,-1)
          indexString = index.Value
          break

        default:
          return [
            null,
            new Error("LINE " + arrayNode.LineNumber + " INDEX MUST BE OF TYPE NUMBER, IDENTIFIER, STRING, GOT: " + index.Type),
          ]
      }
    }

    return [left.Table[indexString], null]
  }

  return [new Null(), null]
}

function evalTable(tableNode, Environment) {
  let table = new Table({})
  Object.keys(tableNode.Table).forEach(function(key) {
    let [entry, entryErr] = Evaluate(tableNode.Table[key], Environment)
    if (entryErr != null) return [null, entryErr]

    table.Table[key] = entry
  })

  return [table, null]
}

function evalArray(arrayNode, Environment) {
  let [elements, elementsErr] = evalArguments(arrayNode.Elements, Environment)
  if (elementsErr != null) return [null, elementsErr]

  return [new Array(elements), null]
}
 
function ReturnWrapper(returnNode, Environment) {
  let [expression, expressionErr] = Evaluate(returnNode.Expression, Environment)
  if (expressionErr != null) return [null, expressionErr]
  return [new Return(expression), null]
}

function Invoke(invokeNode, Environment) {
  let [func, funcErr] = Evaluate(invokeNode.Function, Environment) 
  if (funcErr != null) return [null, funcErr]


  let [args, argErr] = evalArguments(invokeNode.Arguments, Environment)
  if (argErr != null) return [null, argErr]

  if (func.Type == TOKENS.PREDEFINED) {
    return func.Fn(invokeNode.LineNumber, args, Environment) // possibly enclosedEnvironment
  }

  let [enclosedEnvironment, envErr] = extendEnvironment(Environment, args, func) 
  if (envErr != null) return [null, envErr]

  //POSSIBLY WRAP RETURN VALUE
  let [returnValue, returnErr] = Evaluate(func.Body, enclosedEnvironment)
  if (returnErr != null) return [null, returnErr]
  if (returnValue.Type == TOKENS.RETURN) return [returnValue.Expression, null]
  return [new Null(), null]
}

function extendEnvironment(wrapper, args, func) {
  let enclosed = CreateEnvironment(wrapper.Kernel)
  enclosed.Global = wrapper.Global

  if (args.length > func.Parameters.length) {
    return [
      null,
      new Error("LINE " + func.LineNumber + " SUPPLIED ARGS TO FUNCTION: " + func.Identifier.Identifier + " GREATER THAN " + func.Parameters.length)
    ]
  } else if (args.length < func.Parameters.length) {
    return [
      null,
      new Error("LINE " + func.LineNumber + " SUPPLIED ARGS TO FUNCTION: " + func.Identifier.Identifier + " LESS THAN " + func.Parameters.length)
    ]
  }

  for (let i = 0; i < args.length; i++) {
    enclosed.Local[func.Parameters[i].Identifier] = args[i]
  }

  return [enclosed, null]
}

function evalArguments(args, Environment) {
  let resultArgs = []
  for (let i = 0; i < args.length; i++) {
    let [evaluated, evalErr] = Evaluate(args[i], Environment)
    if (evalErr != null) return [null, evalErr]
    resultArgs.push(evaluated)
  }
  return [resultArgs, null]
}

function FunctionDeclaration(functionNode, Environment) {
  if (Environment.Global[functionNode.Identifier.Identifier] != null) return [
    null,
    new Error("LINE " +  functionNode.LineNumber + " VARIABLE WITH NAME: " + functionNode.Identifier.Identifier + " ALREADY EXISTS")  
  ]
  
  Environment.Global[functionNode.Identifier.Identifier] = new Function(
    functionNode.Parameters, 
    functionNode.Body
  )  

  return [new Null(), null]
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
      
    let [consequence, consequenceErr] = Evaluate(whileNode.Consequence, Environment)
    if (consequenceErr != null) return [null, consequenceErr]
    if (consequence.Type == TOKENS.RETURN) return [consequence, null]

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
      let [eval, evalErr] = Evaluate(ifNode.Conditionals[index][1], Environment)
      if (evalErr != null) return [null, evalErr]
      if (eval.Type == TOKENS.RETURN) return [eval, null]
    }
     index++
  }

  if (!isSatisfied && ifNode.Alternative != null) {
    let [eval, evalErr] = Evaluate(ifNode.Alternative, Environment)
    if (evalErr != null) return [null, evalErr]
    if (eval.Type == TOKENS.RETURN) return [eval, null]
  }

  return [new Null(), null]
}

function Identifier(identifierNode, Environment) {
  let [value, err] = [null, null]
  if (PREDEFINED_FUNCTIONS[identifierNode.Identifier] != null) {
    value = PREDEFINED_FUNCTIONS[identifierNode.Identifier]
  } else if (Environment.Local[identifierNode.Identifier] != null) {
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
      if (Environment.Local[assignNode.Left.Identifier] != null) {
        Environment.Local[assignNode.Left.Identifier] = Right
        return [new Null(), null]
      }

      Environment.Global[assignNode.Left.Identifier] = Right
    }

  } else if (assignNode.Left.Type == TOKENS.INDEX) {
    let [_, string, stringErr] = generateString(assignNode.Left, Environment)
    if (stringErr != null) return [null, stringErr]
    let [left, leftErr] = getArray(assignNode.Left, Environment)
    //if (leftErr != null) return [null, leftErr]
    
   // if (left.Type == TOKENS.ARRAY) return assignArray(left, assignNode, Right, Environment)  
    //else return assignTable(left, assignNode, Right, Environment)
    let str = "left" + string + " = Right"
    //console.log(str, left)

    try {
      eval(str)
    } catch (e) {
      if (e instanceof TypeError) return [
        null,
        new Error("LINE " + assignNode.LineNumber + " CANNOT ASSIGN TO PROVIDED DEPTH")
      ]
      
    }
    
    console.log(left)
    return [left, null]
  }

  return [new Null(), null]
}

function generateString(node, Environment) {
  if (node.Left.Type != TOKENS.INDEX) {
    let [left, leftErr] = Evaluate(node.Left, Environment)
    if (leftErr != null) return [null, null, leftErr]

    if (left.Type == TOKENS.ARRAY) {
      let [index, indexErr] = Evaluate(node.Index, Environment)
      if (indexErr != null) return [null, null, indexErr]

      if (index.Type != TOKENS.NUMBER) return [
        null,
        null,
        new Error("LINE " + node.LineNumber + " INDEX ERROR, INDEX MUST BE TYPE: NUMBER, GOT: " + index.Type)
      ]

      if (index.Value >= left.Elements.length) return [
        null,
        null,
        new Error("LINE " + node.LineNumber + " INDEX ERROR: INDEX OUT OF RANGE"),
      ]

      return [left.Elements[index.Value], ".Elements[" + index.Value.toString() + "]", null]
    } else {
      //TODO: INITIAL TABLE
      let [elem, tableStr, tableErr] = handleTable(node, left, Environment) 
      if (tableErr != null) return [null, null, tableErr] 
      return [elem, tableStr, null]
    }
    return [null, null, ""]
  }

  let [elements, str] = generateString(node.Left, Environment)
  if (elements.Type == TOKENS.TABLE) {
    let [elem, tableStr, tableErr] = handleTable(node, elements, Environment) 
    if (tableErr != null) return [null, null, tableErr] 
    return [elem, str + tableStr, null]
  } else {
    let [index, indexErr] = Evaluate(node.Index, Environment)
    if (indexErr != null) return [null, null, indexErr]

    if (index.Type != TOKENS.NUMBER) return [
      null,
      null,
      new Error("LINE " + node.LineNumber + " INDEX ERROR, INDEX MUST BE TYPE: NUMBER, GOT: " + index.Type)
    ]

    if (index.Value >= elements.Elements.length) return [
      null,
      null,
      new Error("LINE " + node.LineNumber + " INDEX ERROR: INDEX OUT OF RANGE"),
    ]

    return [elements.Elements[index.Value], ".Elements[" + index.Value.toString() + "]", null]
  }

  return [null, null, ""]
}

function handleTable(node, table, Environment) {
  let [key, keyErr] = [null, null]
  if (node.Index.Type == TOKENS.IDENTIFIER) {
    indexString = node.Index.Identifier
    index = node.Index

    if (table.Table[indexString] == undefined) return [
      null,
      null,
      new Error("LINE " + node.LineNumber + " KEY: " + indexString + " NOT IN DICTIONARY")
    ]

    return [table.Table[indexString], ".Table." + indexString, null]
    //return generateTableIndexString("." + indexString + ".Table" + str, node.Left, table, Environment)
  } else {
    [key, keyErr] = Evaluate(node.Index, Environment)
    if (keyErr != null) return [null, null, keyErr]

    let indexString = ""
    switch (key.Type) {
      case TOKENS.STRING:
        indexString = key.Value
        break

      case TOKENS.NUMBER:
        indexString = key.Value.toString()
        break

      default:
        return [
          null,
          null,
          new Error("LINE " + node.LineNumber + " INDEX ERROR, INDEX MUST BE TYPE: NUMBER, STRING OR IDENTIFIER, GOT: " + key.Type)
        ]
    }
    if (table.Table[indexString] == undefined) return [
      null,
      null,
      new Error("LINE " + node.LineNumber + " KEY: " + indexString + " NOT IN DICTIONARY")
    ]

    //if (key.Type == TOKENS.STRING) indexString = '"' + indexString + '"'
    //console.log(table.Table, table.Table[indexString], indexString)
    return [table.Table[indexString], ".Table[\"" + indexString + "\"]", null]
    //return generateTableIndexString("[" + indexString + "].Table" + str, node.Left, table, Environment)
    }

}
function assignTable(table, assignNode, Right, Environment) {
  let [generatedString, generatedErr] = generateTableIndexString("", assignNode.Left, table, Environment) 
  if (generatedErr != null) return [null, generatedErr]

  let str = "table.Table" + generatedString.slice(0,-6) + " = Right"
  try {
    eval(str)
  } catch (e) {
    if (e instanceof TypeError) return [
      null,
      new Error("LINE " + assignNode.LineNumber + " CANNOT ASSIGN TO PROVIDED DEPTH")
    ]
    
  }

  return [table, null]
}

function generateTableIndexString(str, node, table, Environment) {
  if (node.Type != TOKENS.INDEX) {
    return [str, null]
  }   
  
  let [index, indexErr] = [null, null]
  if (node.Index.Type == TOKENS.IDENTIFIER) {
    indexString = node.Index.Identifier
    index = node.Index

    //if (table.Table[indexString] == undefined) return [
     // null,
     // new Error("LINE " + node.LineNumber + " KEY: " + indexString + " NOT IN DICTIONARY")
    //]

    return generateTableIndexString("." + indexString + ".Table" + str, node.Left, table, Environment)
  } else {
    [index, indexErr] = Evaluate(node.Index, Environment)
    if (indexErr != null) return [null, indexErr]

    let indexString = ""
    switch (index.Type) {
      case TOKENS.STRING:
        indexString = index.Value
        break

      case TOKENS.NUMBER:
        indexString = index.Value.toString()
        break

      default:
        return [
          null,
          new Error("LINE " + node.LineNumber + " INDEX ERROR, INDEX MUST BE TYPE: NUMBER, STRING OR IDENTIFIER, GOT: " + index.Type)
        ]
    }
    //if (table.Table[indexString] == undefined) return [
     // null,
     // new Error("LINE " + node.LineNumber + " KEY: " + indexString + " NOT IN DICTIONARY")
   // ]

    if (index.Type == TOKENS.STRING) indexString = '"' + indexString + '"'
    return generateTableIndexString("[" + indexString + "].Table" + str, node.Left, table, Environment)
    }

}

function assignArray(array, assignNode, Right, Environment) {
    let [generatedString, generatedErr] = generateIndexString("", assignNode.Left, array, Environment) 
    if (generatedErr != null) return [null, generatedErr]
    //let [generatedString, err] = generateString(assignNode.Left, base, Environment)

    let str = "array.Elements" + generatedString.slice(0,-9) + " = Right"
    try {
      eval(str)
    } catch (e) {
      if (e instanceof TypeError) return [
        null,
        new Error("LINE " + assignNode.LineNumber + " CANNOT ASSIGN TO PROVIDED DEPTH")
      ]
      
    }

    return [array, null]
}

function getArray(node, Environment) {
  if (node.Type == TOKENS.INDEX)  {
    return getArray(node.Left, Environment)
  }
    
  return Evaluate(node, Environment)
}

function generateIndexString(str, node, array, Environment) { 
  if (node.Type != TOKENS.INDEX) {
    return [str, null]
  }   
  
  let [index, indexErr] = Evaluate(node.Index, Environment)
  if (indexErr != null) return [null, indexErr]

  if (index.Type != TOKENS.NUMBER) return [
    null,
    new Error("LINE " + node.LineNumber + " INDEX ERROR, INDEX MUST BE TYPE: NUMBER, GOT: " + index.Type)
  ]

  if (index.Value >= array.Elements.length) return [
    null,
    new Error("LINE " + node.LineNumber + " INDEX ERROR: INDEX OUT OF RANGE"),
  ]

  return generateIndexString("[" + index.Value + "].Elements" + str, node.Left, array, Environment)
}  

// evaluate all sub nodes and return last value
function Program(programNode, Environment) {
  let [result, err] = [null, null]
  for (let i = 0; i < programNode.Nodes.length; i++) {
    [result, err] = Evaluate(programNode.Nodes[i], Environment)
    if (err != null) return [null, err]

    if (result.Type == TOKENS.RETURN) 
        return [result, null]

    //if (result.Type != TOKENS.NULL) console.log(result)
  }

  return [new Null(), null]
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
