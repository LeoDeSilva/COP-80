const { TOKENS, Error } = require("../Lexer/tokens.js")
const {SpriteChip} = require("../../../../Chips/Display/SpriteChip.js")

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

  if (![TOKENS.STRING, TOKENS.ARRAY].includes(args[0].Type)) return [
    null,
    new Error("LINE " + LineNumber + " ARGUMENT " + (Index + 1) + " TO " + Identifier + "() MUST BE OF TYPE: ARRAY OR STRING , GOT: " + Args[Index].Type)
  ]

  if (args[0].Type == TOKENS.STRING)
    return [new Number(args[0].Value.length), null]
  else
    return [new Number(args[0].Elements.length), null]
}

function flr(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "FLR", 1, args)
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "FLR", 0, TOKENS.NUMBER, args)

  return [new Number(Math.floor(args[0].Value)), null]
}

function sqrt(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "SQRT", 1, args)
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "SQRT", 0, TOKENS.NUMBER, args)

  return [new Number(Math.sqrt(args[0].Value)), null]
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

function btnp(LineNumber, args, Environment) {
  if (args.length != 1) return checkLength(LineNumber, "BTN", 1, args)
  if (args[0].Type != TOKENS.STRING) return checkArgument(LineNumber, "BTN", 0, TOKENS.STRING, args)


  let mappings = {
    "ENTER": "Enter",
    "LEFT": "ArrowLeft",
    "RIGHT": "ArrowRight",
    "UP": "ArrowUp",
    "DOWN": "ArrowDown",
    "BACKSPACE": "Backspace",
    "SPACE": " ",
    "SHIFT": "Shift",
    "TAB": "Tab",
  }

  let key = args[0].Value.toLowerCase()
  if (mappings[args[0].Value] != null) key = mappings[args[0].Value]

  return [new Number(Environment.Kernel.KeyboardChip.BtnDown(key)), null]
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
    "SPACE": " ",
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

  try {
    Environment.Kernel.lastProgram.appendHistory("string", str, 6);
  } catch (error) {
    Environment.Kernel.loadedProgram.appendHistory("string", str, 6);
  }
  return [new Null(), null]
}

function round(LineNumber, args, Environment) {
  if (args.length != 2) return checkLength(LineNumber, "ROUND", 2, args)  
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "ROUND", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "ROUND", 1, TOKENS.NUMBER, args)

  //let roundedValue = args[0].Value.toFixed(args[1].Value)
  let roundedValue = args[0].Value.toFixed(args[1].Value)
  return [new Number(parseFloat(roundedValue)), null]
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

  Environment.Kernel.DisplayChip.Rect(Math.floor(args[0].Value-Environment.Camera.x), Math.floor(args[1].Value-Environment.Camera.y), Math.floor(args[2].Value), Math.floor(args[3].Value), args[4].Value) 
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
   
  Environment.Kernel.DisplayChip.setPixel(Math.floor(args[0].Value-Environment.Camera.x), Math.floor(args[1].Value-Environment.Camera.y), args[2].Value)
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

function range(LineNumber, args, Environment) {
  if (args.length > 3 || args.length < 1) return [
    null,
    new Error("LINE " + LineNumber + " EXPECTED 1, 2 OR 3 ARGS WHEN CALLING RANGE, GOT: " + args.length)
  ]

  let start = 0
  let stop = 0
  let step = 1

  if (args.length >= 1) {
    if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RANGE", 0, TOKENS.NUMBER, args)
    stop = args[0].Value
  }
  
  if (args.length >= 2){
    if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RANGE", 1, TOKENS.NUMBER, args)
    start = args[0].Value
    stop = args[1].Value
  }

  if (args.length == 3) {
    if (args[2].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "RANGE", 2, TOKENS.NUMBER, args)
    step = args[2].Value
  }

  let array = []
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    array.push(new Number(i))
  }
  
  return [new Array(array), null]
}

function spr(LineNumber, args, Environment) {
  if (args.length < 3) return checkLength(LineNumber, "SPR", 3, args)  
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "SPR", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "SPR", 1, TOKENS.NUMBER, args)
  if (args[2].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "SPR", 2, TOKENS.NUMBER, args)

  if (Environment.Sprites.length < 64) return [
    null,
    new Error("LINE: " + LineNumber + " SPRITES NOT LOADED BEFORE SPR() IS CALLED")
  ]
  
  if (args[0].Value >= Environment.Sprites.length) return [
    null,
    new Error("LINE " + LineNumber + " SPRITE INDEX > 64, GOT: " + args[0].Value)
  ] 

  let sprite = [...Environment.Sprites[args[0].Value].sprite]

  if (args.length >= 4) {
    if (args[3].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "SPR", 3, TOKENS.NUMBER, args)
    if (args[3].Value == 1) {
      let index = 0;
      for (let y = 0; y < 8; y++) {
        let max = 8
        for (let x = 0; x < 4; x++) {
          let oppColour = sprite[index + max - 1]
          sprite[index + max - 1] = sprite[index]
          sprite[index] = oppColour
          max -= 2
          index ++
        }
        index += 4
      }
    }
  } 

  if (args.length == 5) {
    if (args[4].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "SPR", 4, TOKENS.NUMBER, args)
    if (args[4].Value == 1) {
      let x = 0
      let y = 0
      max = 8
      for (let i = 0; i < 32; i++) {
        let oppColour = sprite[(y+max-1)*8 + x]
        sprite[(y+max-1)*8 + x] = sprite[i]
        sprite[i] = oppColour
        x++
        if (x >= 8) {
          x = 0
          y ++
          max -= 2
        }
      }
    }
  }

  let spriteChip = new SpriteChip(sprite, 8, 8)
  spriteChip.Blit(Environment.Kernel.DisplayChip, Math.floor(args[1].Value-Environment.Camera.x), Math.floor(args[2].Value-Environment.Camera.y))

  return [new Null(), null]
}

function map(LineNumber, args, Environment) {
  if (args.length < 2) return checkLength(LineNumber, "MAP", 2, args)  
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "MAP", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "MAP", 1, TOKENS.NUMBER, args)

  if (Environment.Map == []) return [
    null,
    new Error("LINE: " + LineNumber + " SPRITES NOT LOADED BEFORE MAP() IS CALLED")
  ]

  let xStart = Math.floor(args[0].Value - Environment.Camera.x)
  let yStart = Math.floor(args[1].Value - Environment.Camera.y)

  let yIndexStart =0
  let xIndexStart =0

  if (args[0].Value < 0) {
    xIndexStart = 0
    xStart = 0
  }

  if (args[1].Value < 0) {
    yIndexStart = 0
    yStart = 0
  }

  let x = xStart
  let y = yStart

  let yIndex = yIndexStart
  while (yIndex < yIndexStart + 128) {
    let xIndex = xIndexStart
    while (xIndex < yIndexStart + 128) {
      if (Environment.Map[yIndex][xIndex] != -1) {
        let sprite = new SpriteChip(Environment.Sprites[Environment.Map[yIndex][xIndex]].sprite, 8, 8) 
        sprite.Blit(Environment.Kernel.DisplayChip, x, y)
      }
      xIndex++
      x += 8
    }
    y += 8
    x = xStart
    yIndex++
  }

  //Environment.Camera.x = args[0].Value
  //Environment.Camera.y = args[1].Value

  return [new Null(), null]
}

function mget(LineNumber, args, Environment) {
  if (args.length < 2) return checkLength(LineNumber, "MGET", 2, args)  
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "MGET", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "MGET", 1, TOKENS.NUMBER, args)

  if (Environment.Map == []) return [
    null,
    new Error("LINE: " + LineNumber + " SPRITES NOT LOADED BEFORE MGET() IS CALLED")
  ]

  let xIndex = Math.floor((args[0].Value)/8) 
  let yIndex = Math.floor((args[1].Value)/8) 

  return [new Number(Environment.Map[yIndex][xIndex]), null]
}

function mset(LineNumber, args, Environment) {
  if (args.length < 3) return checkLength(LineNumber, "MSET", 2, args)  
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "MSET", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "MSET", 1, TOKENS.NUMBER, args)
  if (args[2].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "MSET", 2, TOKENS.NUMBER, args)

  if (Environment.Map == []) return [
    null,
    new Error("LINE: " + LineNumber + " SPRITES NOT LOADED BEFORE MSET() IS CALLED")
  ]

  let xIndex = Math.floor((args[0].Value)/8) 
  let yIndex = Math.floor((args[1].Value)/8) 
  Environment.Map[yIndex][xIndex] = args[2].Value
  return [new Null(), null]

}

function fget(LineNumber, args, Environment) {
  if (args.length < 2) return checkLength(LineNumber, "FGET", 2, args)  
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "FGET", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "FGET", 1, TOKENS.NUMBER, args)

  if (args[1].Value > 7) return [
    null,
    new Error("LINE " + LineNumber + " FLAG INDEX CANNOT EXCEED 7, GOT: " + args[2].Value.toString())
  ]

  if (Environment.Map == []) return [
    null,
    new Error("LINE: " + LineNumber + " SPRITES NOT LOADED BEFORE MGET() IS CALLED")
  ]

  if (args[0].Value == -1) return [new Number(0), null]

  return [new Number(Environment.Sprites[args[0].Value].flags[args[1].Value]), null]
}

function Camera(LineNumber, args, Environment) {
  if (args.length < 2) return checkLength(LineNumber, "FGET", 2, args)  
  if (args[0].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "FGET", 0, TOKENS.NUMBER, args)
  if (args[1].Type != TOKENS.NUMBER) return checkArgument(LineNumber, "FGET", 1, TOKENS.NUMBER, args)

  Environment.Camera.x = args[0].Value
  Environment.Camera.y = args[1].Value
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
    "FLR": new Predefined(flr),
    "RND": new Predefined(rnd),
    "ABS": new Predefined(abs),
    "PUSH": new Predefined(push),
    "REMOVE": new Predefined(remove),
    "POP": new Predefined(pop),
    "INSERT": new Predefined(insert),
    "BTNP": new Predefined(btnp),
    "ROUND": new Predefined(round),
    "SPR": new Predefined(spr),
    "MAP": new Predefined(map),
    "MGET": new Predefined(mget),
    "FGET": new Predefined(fget),
    "RANGE": new Predefined(range),
    "CAMERA": new Predefined(Camera),
    "MSET": new Predefined(mset),
    "SQRT": new Predefined(sqrt),
  }
}
