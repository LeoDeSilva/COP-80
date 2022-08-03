const { TOKENS, Error } = require("../Lexer/tokens.js")

const { Predefined, Null, Number } = require("./objects.js");

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

function joinArguments(LineNumber, args) {
  let str = ""
  for (let i = 0; i < args.length; i++) {
    switch(args[i].Type) {
      case TOKENS.NUMBER:
        str += args[i].Value.toString()
        break
      case TOKENS.STRING:
        str += args[i].Value
        break
    }

    if (i != args.length - 1) str += " "
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
  Environment.Kernel.FontChip.BlitText(Environment.Kernel.DisplayChip, msg, args[1].Value, args[2].Value, args[3].Value)

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

  Environment.Kernel.DisplayChip.Rect(args[0].Value, args[1].Value, args[2].Value, args[3].Value, args[4].Value) 
  return [new Null(), null]
}

function set(LineNumber, args, Environment) {
  if (args.length != 3) return checkLength(LineNumber, "SET", 3, args)  

  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RECT", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RECT", 1, TOKENS.NUMBER, args)
  if (args[2].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RECT", 2, TOKENS.NUMBER, args)

  if (args[2].Value > 15) return [
    null,
    new Error("LINE " + LineNumber + " COLOUR CODE GREATER THAN 16, GOT: " + args[2].Value)
  ]
   
  Environment.Kernel.DisplayChip.setPixel(args[0].Value, args[1].Value, args[2].Value)
  return [new Null(), null]
}

function fill(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "FILL", 1, args)  
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "TEXT", 0, TOKENS.NUMBER, args)

  if (args[0].Value > 15) return [
    null,
    new Error("LINE " + LineNumber + " COLOUR CODE GREATER THAN 16, GOT: " + args[0].Value)
  ]

  Environment.Kernel.DisplayChip.FillScreen(args[0].Value) 
  return [new Null(), null]
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
  }
}
