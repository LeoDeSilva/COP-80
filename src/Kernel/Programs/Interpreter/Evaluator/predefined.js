const { TOKENS, Error } = require("../Lexer/tokens.js")

const { Predefined, Null, Number, Array} = require("./objects.js");

function checkArgument(LineNumber, Identifier, Index, Type, Args) {
  return [
    null,
    new Error("LINE " + LineNumber + " ARGUMENT " + (Index + 1) + " TO " + Identifier + "() MUST BE OF TYPE: " + Type + " , GOT: " + Args[Index].Type)
  ]
}

function checkLength(LineNumber, Identifier, Length, Args) {
  return [
      null,
      new Error("Line " + LineNumber + " WRONG NUMBER OF ARGUMENTS WHEN CALLING " + Identifier + "(), GOT: " + Args.length + " EXPECTED: " + Length)
    ]
}

function len(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "LEN", 1, args)  

  if (args[0].Type != TOKENS.STRING) return checkArgument(LineNumber, "LEN", 0, TOKENS.STRING, args)

  return [new Number(args[0].Value.length), null]
}

function flr(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "FLR", 1, args)
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "FLR", 0, TOKENS.NUMBER, args)

  return [new Number(Math.floor(args[0].Value)), null]
}

function abs(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "ABS", 1, args)
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "ABS", 0, TOKENS.NUMBER, args)

  return [new Number(Math.abs(args[0].Value)), null]
}

function rnd(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "RND", 1, args)
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RND", 0, TOKENS.NUMBER, args)

  return [new Number(Math.random() * args[0].Value), null]
}

function btn(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "BTN", 1, args)
  if (args[0].Type != TOKENS.STRING) return checkArgument(LineNumber, "BTN", 0, TOKENS.STRING, args)

  let mappings = {
    "ENTER": "Enter",
    "LEFT": "ArrowLeft",
    "RIGHT": "ArrowRight",
    "UP": "ArrowUp",
    "DOWN": "ArrowDown",
    "BACKSPACE": "Backspace",
    "SHIFT": "Shift",
    "TAB": "Tab",
  }

  //if (!["LEFT", "RIGHT", "UP", "DOWN", "X", "Z"].includes(args[0].Value)) return [
  //  null,
  //  new Error("LINE " + LineNumber + " ARGUMENT TO BTN() MUST BE OF : LEFT, RIGHT, UP', DOWN, X, Z")
  //]

  let key = args[0].Value.toLowerCase()
  if (mappings[args[0].Value] != null) key = mappings[args[0].Value]

  return [new Number(Environment.Kernel.KeyboardChip.isPressed(key)), null]
}

function joinArguments(LineNumber, args, join=" ") {
  let str = ""
  for (let i = 0; i < args.length; i++) {
    switch(args[i].Type) {
      case TOKENS.NUMBER:
        str += parseFloat(args[i].Value.toFixed(12)).toString()
        break
      case TOKENS.ARRAY:
        let [elementStr, elementErr] = joinArguments(LineNumber, args[i].Elements, ",")
        if (elementErr != null) return [null, elementErr]
        str += "[" + elementStr + "]"
        break
      case TOKENS.STRING:
        str += args[i].Value
        break
    }

    if (i != args.length - 1) str += join
  }

  return [str, null]
}

function print(LineNumber, args, Environment) {
  let [str, strErr] = joinArguments(LineNumber, args)
  if (strErr != null) return [null, strErr]

  Environment.Kernel.lastProgram.appendHistory("string", str, 6);
  return [new Null(), null]
}

function text(LineNumber, args, Environment) {
  if (args.length != 4) return checkLength(LineNumber, "TEXT", 4, args)  

  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "TEXT", 1, TOKENS.NUMBER, args)
  if (args[2].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "TEXT", 2, TOKENS.NUMBER, args)
  if (args[3].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "TEXT", 3, TOKENS.NUMBER, args)

  if (args[3].Value > 15) return [
    null,
    new Error("LINE " + LineNumber + " COLOUR CODE GREATER THAN 16, GOT: " + args[3].Value)
  ]

  let msg = args[0].Value
  if (args[0].Type == TOKENS.NUMBER) msg = msg.toString()
  Environment.Kernel.FontChip.BlitText(Environment.Kernel.DisplayChip, msg, Math.floor(args[1].Value), Math.floor(args[2].Value), args[3].Value)

  return [new Null(), null]
}

function rect(LineNumber, args, Environment) {
  if (args.length != 5) return checkLength(LineNumber, "RECT", 5, args)  

  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RECT", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RECT", 1, TOKENS.NUMBER, args)
  if (args[2].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RECT", 2, TOKENS.NUMBER, args)
  if (args[3].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RECT", 3, TOKENS.NUMBER, args)
  if (args[4].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RECT", 4, TOKENS.NUMBER, args)

  if (args[4].Value > 15) return [
    null,
    new Error("LINE " + LineNumber + " COLOUR CODE GREATER THAN 16, GOT: " + args[4].Value)
  ]

  Environment.Kernel.DisplayChip.Rect(Math.floor(args[0].Value), Math.floor(args[1].Value), Math.floor(args[2].Value), Math.floor(args[3].Value), args[4].Value) 
  return [new Null(), null]
}

function set(LineNumber, args, Environment) {
  if (args.length != 3) return checkLength(LineNumber, "SET", 3, args)  

  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "SET", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "SET", 1, TOKENS.NUMBER, args)
  if (args[2].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "SET", 2, TOKENS.NUMBER, args)

  if (args[2].Value > 15) return [
    null,
    new Error("LINE " + LineNumber + " COLOUR CODE GREATER THAN 16, GOT: " + args[2].Value)
  ]
   
  Environment.Kernel.DisplayChip.setPixel(Math.floor(args[0].Value), Math.floor(args[1].Value), args[2].Value)
  return [new Null(), null]
}

function fill(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "FILL", 1, args)  
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "FILL", 0, TOKENS.NUMBER, args)

  if (args[0].Value > 15) return [
    null,
    new Error("LINE " + LineNumber + " COLOUR CODE GREATER THAN 16, GOT: " + args[0].Value)
  ]

  Environment.Kernel.DisplayChip.FillScreen(args[0].Value) 
  return [new Null(), null]
}

function push(LineNumber, args, Environment) {
  if (args.length != 2) return checkLength(LineNumber, "PUSH", 2, args)  
  if (args[0].Type != TOKENS.ARRAY) return checkArgument(LineNumber, "PUSH", 0, TOKENS.ARRAY, args)
  return [new Array([].concat(args[0].Elements, args[1])), null] 
}

function remove(LineNumber, args, Environment) {
  if (args.length != 2) return checkLength(LineNumber, "REMOVE", 1, args)  
  if (args[0].Type != TOKENS.ARRAY) return checkArgument(LineNumber, "REMOVE", 0, TOKENS.ARRAY, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "REMOVE", 1, TOKENS.NUMBER, args)

  if (args[1].Value >= args[0].Elements.length) return [
    null,
    new Error("LINE " + LineNumber + " REMOVE INDEX OUT OF RANGE: " + args[1].Value)
  ]

  return [
    new Array(args[0].Elements.slice(0,args[1].Value).concat(
      args[0].Elements.slice(
        args[1].Value + 1)
    )), 
    null
  ] 
}

function pop(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "REMOVE", 1, args)  
  if (args[0].Type != TOKENS.ARRAY) return checkArgument(LineNumber, "REMOVE", 0, TOKENS.ARRAY, args)

  return [
    new Array( args[0].Elements.slice(0, args[0].Elements.length - 1).concat(
        args[0].Elements.slice(args[0].Elements.length))
    ), 
    null
  ] 
}

function insert(LineNumber, args, Environment) {
  if (args.length != 3) return checkLength(LineNumber, "INSERT", 3, args)  
  if (args[0].Type != TOKENS.ARRAY) return checkArgument(LineNumber, "INSERT", 0, TOKENS.ARRAY, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "INSERT", 1, TOKENS.NUMBER, args)


  return[
    new Array([...args[0].Elements.slice(0,args[1].Value), args[2], ...args[0].Elements.slice(args[1].Value)]),
    null
  ]
}

module.exports = {
  PREDEFINED_FUNCTIONS: {
    "LEN": new Predefined(len),
    "PRINT": new Predefined(print),
    "TEXT": new Predefined(text),
    "FILL": new Predefined(fill),
    "RECT": new Predefined(rect),
    "SET": new Predefined(set),
    "BTN": new Predefined(btn),
    "FLR": new Predefined(flr),
    "RND": new Predefined(rnd),
    "ABS": new Predefined(abs),
    "PUSH": new Predefined(push),
    "REMOVE": new Predefined(remove),
    "POP": new Predefined(pop),
    "INSERT": new Predefined(insert),
  }
}
