const { Editor } = require("../Editor/Editor");
const { Interpreter } = require("../Interpreter/interpreter");
const { Lexer } = require("../Interpreter/Lexer/lexer");
const { Parser } = require("../Interpreter/Parser/parser");
const { Evaluate } = require("../Interpreter/Evaluator/evaluator")
const { CreateEnvironment } = require("../Interpreter/Evaluator/objects")

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "1234567890";
const PRINTABLES = "!@£$%^&*()_-=+[]{}\\'\"/?.,><#`" + ALPHABET + DIGITS;

function Run(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer);
  let fileName = cmd.content[0];
  if (fileName == "" || fileName == undefined) {
    Terminal.appendHistory("string", "ERROR: FILE NOT FOUND", 14);
    return;
  }

  let file = Terminal.Kernel.MemoryChip.GetFile(fileName);
  if (file === undefined) {
    Terminal.appendHistory("string", "ERROR: FILE NOT FOUND", 14);
    return;
  }

  let lexer = new Lexer(file.FileData);
  let [tokens, lexerErr] = lexer.Lex(false);

  if (lexerErr != null) {
    Terminal.appendHistory("string", lexerErr.msg, 14);
    return;
  }

  tokens = tokens.filter(function(tok) {
    return !(["SPACE", "TAB"].includes(tok.Type))
  })

  let parser = new Parser(tokens);
  let [ast, parserErr] = parser.Parse();

  console.log(ast)
  if (parserErr != null) {
    Terminal.appendHistory("string", parserErr.msg, 14);
    return;
  }

  let env = CreateEnvironment(Terminal.Kernel)
  let [result, evaluatorErr] = Evaluate(ast, env)
  if (evaluatorErr != null) {
    Terminal.appendHistory("string", evaluatorErr.msg, 14);
    return;
  }

  if (env.Global["_UPDATE"] && env.Global["_UPDATE"].Type == "FUNCTION") {
    //Terminal.Kernel.Load(new Interpreter(Terminal.Kernel, ast));
    Terminal.Kernel.Load(new Interpreter(Terminal.Kernel, env));
    Terminal.Kernel.lastProgram = Terminal;
  }
}

function Touch(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer);
  let fileName = cmd.content[0];

  if (fileName != null) {
    let err = Terminal.Kernel.MemoryChip.CreateFile(fileName, "");
    if (err) {
      Terminal.appendHistory("string", "ERROR: FILE ALREADY EXISTS", 14);
    }
  }
}

function Delete(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer)
  let fileName = cmd.content[0]

  if (fileName != null) {
    let err = Terminal.Kernel.MemoryChip.DeleteFile(fileName);
    if (err) {
      Terminal.appendHistory("string", err, 14);
    }
  }
}

function Rmdir(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer)
  let dirName = cmd.content[0]

  if (dirName != null) {
    let err = Terminal.Kernel.MemoryChip.DeleteDirectory(dirName);
    if (err) {
      Terminal.appendHistory("string", err, 14);
    }
  }
}

function ChangeDirectory(Terminal) {
  let directory = parseCommand(Terminal.inputBuffer).content[0];
  let err = 0;

  err = Terminal.Kernel.MemoryChip.ChangeDirectory(directory)

  //if (directory == null) {
  //  err = 1;
  //} else if (directory == "..") {
  //  err = Terminal.Kernel.MemoryChip.RegressDirectory();
  //} else {
  //  err = Terminal.Kernel.MemoryChip.EnterDirectory(directory);
  //}

  if (err != null) {
    Terminal.appendHistory("string", err, 14);
    return;
  }

  Terminal.appendHistory(
    "string",
    Terminal.Kernel.MemoryChip.GetFilePath(),
    12
  );
}

function MakeDirectory(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer);
  let folderName = cmd.content[0];
  if (folderName != null) {
    let err = Terminal.Kernel.MemoryChip.CreateDirectory(folderName);
    if (err) {
      Terminal.appendHistory("string", "ERROR: FILE ALREADY EXISTS", 14);
    }
  }
}

function ListDirectory(Terminal) {
  console.log(Terminal.Kernel.MemoryChip.CurrentDirectory)
  for ( let i = 0; i < Terminal.Kernel.MemoryChip.CurrentDirectory.SubDirs.length; i++) {
    let content = Terminal.Kernel.MemoryChip.CurrentDirectory.SubDirs[i].Name;
    Terminal.appendHistory("string", content, 14);
  }

  for ( let i = 0; i < Terminal.Kernel.MemoryChip.CurrentDirectory.Files.length; i++) {
    let content = Terminal.Kernel.MemoryChip.CurrentDirectory.Files[i].Name;
    Terminal.appendHistory("string", content, 6);
  }
}

function Edit(Terminal) {
  let fileName = parseCommand(Terminal.inputBuffer).content[0];
  if (fileName == "" || fileName == undefined) {
    Terminal.appendHistory("string", "ERROR: FILE NOT FOUND", 14);
    return;
  }

  let file = Terminal.Kernel.MemoryChip.GetFile(fileName);
  if (file === undefined) Terminal.Kernel.MemoryChip.CreateFile(fileName, "");

  Terminal.Kernel.Load(new Editor(Terminal.Kernel, fileName));
  Terminal.Kernel.lastProgram = Terminal;
}


function Cat(Terminal) {
  let fileName = parseCommand(Terminal.inputBuffer).content[0];
  if (fileName == "" || fileName == undefined) {
    Terminal.appendHistory("string", "ERROR: FILE NOT FOUND", 14);
    return;
  }

  let file = Terminal.Kernel.MemoryChip.GetFile(fileName);
  if (file === undefined) {
    Terminal.appendHistory("string", "ERROR: FILE NOT FOUND", 14);
    return;
  }

  Terminal.appendHistory("string", file.FileData, 6);
}

function Echo(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer);
  Terminal.appendHistory("string", cmd.content.join(""), 6);
}

function Colour(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer);
  if (cmd.flags.length == 0 || cmd.flags[0].length < 2) {
    Terminal.appendHistory("string", "SYNTAX ERROR", 14);
  }

  let colour = parseInt(cmd.flags[0].slice(1));
  if (colour == NaN || colour > 15) colour = 7;

  Terminal.appendHistory("string", cmd.content.join(""), colour);
}

class Command {
  constructor(command, content, flags) {
    this.command = command;
    this.content = content;
    this.flags = flags;
  }
}

function parseCommand(command) {
  let parsedCommand = new Command("", [], []);

  let currentString = "";
  let i = 0;

  while (i < command.length) {
    switch (command[i]) {
      case '"':
      case "`":
      case "'":
        let quote = command[i];
        var tempString = "";
        initIndex = i;
        missingQuote = false;
        i++;
        while (command[i] != quote) {
          if (i >= command.length) {
            missingQuote = true;
            break;
          }
          if (missingQuote) {
            tempString += '"';
            i = initIndex;
          } else {
            tempString += command[i];
            i++;
          }
        }

        parsedCommand.content.push(tempString);
        break;

      case " ":
        if (currentString != "") parsedCommand.content.push(currentString);
        currentString = "";
        break;

      // "-" signifies a flag (hence record seperatly (independant of order))
      case "-":
        var tempString = "-";
        i++;
        while ((ALPHABET + DIGITS).includes(command[i])) {
          tempString += command[i];
          i++;
        }

        parsedCommand.flags.push(tempString);

      default:
        if (PRINTABLES.includes(command[i])) currentString += command[i];
    }
    i++;
  }

  if (currentString != "") parsedCommand.content.push(currentString);

  return new Command(
    parsedCommand.content[0],
    parsedCommand.content.slice(1),
    parsedCommand.flags
  );
}

function Load(Terminal) {
  let fileName = parseCommand(Terminal.inputBuffer).content[0];
  switch (fileName) {
    case "PIANO":
    case "PIANO.COP":
      Terminal.Kernel.MemoryChip.CreateFile("PIANO.COP", "FN _START() GO\n\tW = 20\n\tPI = 1\n\tLEWAY = 1\n\tPOSITIONS = [64-W, 64, 64+W]\n\tHELD = FALSE\n\tLIVES = 1\n\tSCORE = 0\n\tSPEED = 50\n\tDT = 1/30\n\tBUFFER = 0\n\tMAX = 20\n\tTICKER = MAX\n\tTILES = []\nEND\n\nFN _UPDATE() GO\n\tIF LIVES <= 0 THEN _START() END\n\n\tIF TICKER <= 0 THEN\n\t\tSPAWN()\n\t\tMAX = MAX - 5*DT\n\t\tIF MAX < 15 THEN MAX = 10 END\n\tEND\n\n\tINPUT()\n\tMOVE()\n\tCOLLIDE()\n\tDRAW()\n\n\tBUFFER = BUFFER + 1\n\tTICKER = TICKER - 1\n\tIF TICKER < 0 THEN TICKER = FLR(MAX) END\nEND\n\nFN COLLIDE() GO\n\tTO_REMOVE = []\n\tFOR I IN RANGE(LEN(TILES)) DO\n\t\tT = TILES[I]\n\t\tIF T[1] >= 123 THEN\n\t\t\tIF T[0] == PI THEN\n\t\t\t\tSCORE = SCORE + 1\n\t\t\t\tTO_REMOVE = PUSH(TO_REMOVE, I)\n\t\t\tELSE \n\t\t\t\tIF T[1] >= 123 AND BUFFER > LEWAY THEN\n\t\t\t\t\tLIVES = LIVES - 1\n\t\t\t\t\tFILL(8)\n\t\t\t\t\tTO_REMOVE = PUSH(TO_REMOVE, I)\n\t\t\t\tELIF T[1] >= 123 AND BUFFER <= LEWAY THEN \n\t\t\t\t\tSCORE = SCORE + 1\n\t\t\t\t\tTO_REMOVE = PUSH(TO_REMOVE, I)\n\t\t\t\tEND\n\t\t\tEND\n\t\tEND\n\tEND\n\n\tT_NEW = []\n\tFOR I IN RANGE(LEN(TILES)) DO\n\t\tIF !CONTAINS(TO_REMOVE, I) THEN\n\t\t\tT_NEW = PUSH(T_NEW, TILES[I])\n\t\tEND\n\tEND\n\n\tTILES = T_NEW\nEND\n\nFN CONTAINS(ARRAY, ELEM) GO\n\tFOR E IN ARRAY DO\n\t\tIF E == ELEM THEN\n\t\t\tRETURN TRUE\n\t\tEND\n\tEND\n\tRETURN FALSE\nEND\n\nFN MOVE() GO\n\tFOR T IN TILES DO\n\t\tT[1] = T[1] + SPEED*DT\n\tEND\nEND\n\nFN SPAWN() GO \n\tTILES = PUSH(TILES, [FLR(RND(3)), 0])\nEND\n\nFN INPUT() GO\n\tIF BTN(\"LEFT\") AND !HELD THEN\n\t\tPI = PI - 1\n\t\tBUFFER = 0\n\tELIF BTN(\"RIGHT\") AND !HELD THEN\n\t\tPI = PI + 1\n\t\tBUFFER = 0\n\tEND\n\t\n\tIF PI < 0 THEN PI = 0 END\n\tIF PI > 2 THEN PI = 2 END\n\t\t\n\tIF BTN(\"LEFT\") OR BTN(\"RIGHT\") THEN\n\t\tHELD = TRUE\n\tELSE\n\t\tHELD = FALSE\n\tEND\n\n\tIF BTN(\"1\") THEN PI = 0 END\n\tIF BTN(\"2\") THEN PI = 1 END\n\tIF BTN(\"3\") THEN PI = 2 END\nEND\n\nFN DRAW() GO\n\tFILL(0)\n\tSET(POSITIONS[PI], 127, 7)\n\tFOR T IN TILES DO\n\t\tRECT(POSITIONS[T[0]]-W/2, T[1], W, 1, 7)\n\tEND\n\n\tX = 0\n\tFOR X IN RANGE(0,128,4) DO\n\t\tRECT(X, 123, 2, 1, 6)\n\tEND\n\n\tTEXT(SCORE, 0, 0, 7)\n\tTEXT(LIVES, 0, 6, 8)\nEND ")
      break
    case "SNAKE":
    case "SNAKE.COP":
      Terminal.Kernel.MemoryChip.CreateFile("SNAKE.COP", "FN _START() GO\n\tX = 16\n\tY = 16\n\tSNAKE = [[X,Y]]\n\tFOOD = [FLR(RND(32)), FLR(RND(32))]\n\tDIR = \"UP\"\n\tGROW = FALSE\n\tDEAD = FALSE\n\tSCORE = 0\n\tMAX = 4\n\tTICKER = MAX\nEND\n\nFN _UPDATE() GO\n\tIF DEAD THEN _START() END\n\tIF SCORE >= 10 THEN MAX = 3\n\tELIF SCORE >= 20 THEN MAX = 2 \n\tELIF SCORE >= 40 THEN MAX = 1 END\n\tINPUT()\n\t\n\tIF TICKER == 0 THEN \n\t\tMOVE()\n\tEND\n\n\tCOLLIDE()\n\n\tDRAW()\n\n\tTICKER = TICKER - 1\n\tIF TICKER < 0 THEN TICKER = MAX END\nEND\n\nFN COLLIDE() GO\n\tIF X == FOOD[0] AND Y == FOOD[1] THEN\n\t\tGROW = TRUE\n\t\tSCORE = SCORE + 1\n\t\tFOOD = [FLR(RND(32)), FLR(RND(32))]\n\tEND\n\n\tFOR I IN RANGE(LEN(SNAKE)-1) DO\n\t\tS = SNAKE[I]\n\t\tIF S[0] == X AND S[1] == Y THEN\n\t\t\tDEAD = TRUE\n\t\tEND\n\tEND\n\n\tIF X >= 128 OR X < 0 THEN\n\t\tDEAD = TRUE\n\tELIF Y >= 128 OR Y < 0 THEN \n\t\tDEAD = TRUE\n\tEND\nEND\n\nFN INPUT() GO\n\tIF BTN(\"LEFT\") THEN \n\t\tDIR = \"LEFT\"\n\tELIF BTN(\"RIGHT\") THEN\n\t\tDIR = \"RIGHT\"\n\tELIF BTN(\"UP\") THEN \n\t\tDIR = \"UP\"\n\tELIF BTN(\"DOWN\") THEN\n\t\tDIR = \"DOWN\"\n\tEND\nEND\n\nFN MOVE() GO\n\tIF DIR == \"UP\" THEN\n\t\tY = Y - 1\n\tELIF DIR == \"DOWN\" THEN\n\t\tY = Y + 1\n\tELIF DIR == \"LEFT\" THEN\n\t\tX = X - 1\n\tELSE \n\t\tX = X + 1 \n\tEND\n\t\n\tSNAKE = PUSH(SNAKE, [X,Y])\n\tIF !GROW THEN\n\t\tSNAKE = REMOVE(SNAKE, 0)\n\tELSE \n\t\tGROW = FALSE\n\tEND\nEND\n\nFN DRAW_SNAKE() GO\n\tFOR P IN SNAKE DO\n\t\tRECT(P[0]*4, P[1]*4, 4, 4, 9)\n\tEND\nEND\n\nFN DRAW() GO\n\tFILL(8)\n\tDRAW_SNAKE()\n\tRECT(FOOD[0]*4, FOOD[1]*4, 4, 4, 9)\n\tTEXT(SCORE, 0, 0, 9)\nEND")
      break
    default:
      Terminal.appendHistory("string", "ERROR: FILE NOT FOUND, EXPECTED: PIANO or SNAKE", 14);
  }

}

function Welcome(Terminal) {
  return [
    {
      type: "function",
      content: (Kernel, y) => {
        // return Kernel.Icons["welcome"].Blit(Kernel.DisplayChip, 0, 0);
        //Kernel.Icons["cop-80-icon"].Blit(Kernel.DisplayChip, 0, y);
        //Kernel.DisplayChip.Rect(0, 6, 32, 1, 8)
        //Kernel.DisplayChip.Rect(0, 8, 32, 1, 8)
        return Kernel.Icons["cop-80"].Blit(
          Kernel.DisplayChip,
          0,
          y
        );
      },
      colour: 0,
    },
    {
      type: "string",
      content: "FANTASY CONSOLE",
      colour: 6,
    },
    {
      type: "string",
      content: "",
      colour: 0,
    },
  ];
}

module.exports = {
  Welcome,
  Echo,
  Colour,
  Edit,
  MakeDirectory,
  ListDirectory,
  ChangeDirectory,
  Touch,
  Run,
  Cat,
  Rmdir,
  Delete,
  Load,
};
