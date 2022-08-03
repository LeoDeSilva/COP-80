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
  let [tokens, lexerErr] = lexer.Lex();

  if (lexerErr != null) {
    Terminal.appendHistory("string", lexerErr.msg, 14);
    return;
  }

  let parser = new Parser(tokens);
  let [ast, parserErr] = parser.Parse();
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

function ChangeDirectory(Terminal) {
  let directory = parseCommand(Terminal.inputBuffer).content[0];
  let err = 0;

  if (directory == null) {
    err = 1;
  } else if (directory == "..") {
    err = Terminal.Kernel.MemoryChip.RegressDirectory();
  } else {
    err = Terminal.Kernel.MemoryChip.EnterDirectory(directory);
  }

  if (err == 1) {
    Terminal.appendHistory("string", "SYNTAX ERROR", 14);
    return;
  }

  Terminal.appendHistory(
    "string",
    "/" + Terminal.Kernel.MemoryChip.GetFilePath() + "/",
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

function Welcome(Terminal) {
  return [
    {
      type: "function",
      content: (Kernel, y) => {
        // return Kernel.Icons["welcome"].Blit(Kernel.DisplayChip, 0, 0);
        Kernel.Icons["cop-80-icon"].Blit(Kernel.DisplayChip, 0, y);
        return Kernel.Icons["cop-80"].Blit(
          Kernel.DisplayChip,
          Kernel.Icons["cop-80-icon"].width + 1,
          y
        );
      },
      colour: 0,
    },
    {
      type: "string",
      content: "Fantasy Console",
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
};
