const { Editor } = require("../Editor/Editor");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "1234567890";
const PRINTABLES = "!@£$%^&*()_-=+[]{}\\'\"/?.,><#`" + ALPHABET + DIGITS;

function Touch(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer);
  let fileName = cmd.content[0];
  if (fileName != null) Terminal.Kernel.MemoryChip.CreateFile(fileName, "");
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
    Terminal.History.push({
      type: "string",
      content: "SYNTAX ERROR",
      //   content: Terminal.Kernel.ErrorChip.GetError(),
      colour: 14,
    });
    return;
  }

  Terminal.History.push({
    type: "string",
    content: "/" + Terminal.Kernel.MemoryChip.GetFilePath() + "/",
    colour: 12,
  });
}

function MakeDirectory(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer);
  let folderName = cmd.content[0];
  if (folderName != null)
    Terminal.Kernel.MemoryChip.CreateDirectory(folderName);
}

function ListDirectory(Terminal) {
  for (
    let i = 0;
    i < Terminal.Kernel.MemoryChip.CurrentDirectory.Files.length;
    i++
  ) {
    let content = Terminal.Kernel.MemoryChip.CurrentDirectory.Files[i].Name;
    let colour = 6;
    if (Terminal.Kernel.MemoryChip.CurrentDirectory.Files[i].Type == "folder")
      colour = 14;
    Terminal.History.push({
      type: "string",
      content: content,
      colour: colour,
    });
  }
}

function Edit(Terminal) {
  let fileName = parseCommand(Terminal.inputBuffer).content[0];
  if (fileName == "" || fileName == undefined) {
    Terminal.History.push({
      type: "string",
      content: "ERROR: FILE NOT FOUND",
      colour: 14,
    });
    return;
  }
  let file = Terminal.Kernel.MemoryChip.GetFile(fileName);
  if (file === undefined) Terminal.Kernel.MemoryChip.CreateFile(fileName, "");
  Terminal.Kernel.loadedProgram = new Editor(Terminal.Kernel, fileName);
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

function Echo(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer);
  return {
    type: "string",
    content: cmd.content.join(""),
    colour: 7,
  };
}

function Colour(Terminal) {
  let cmd = parseCommand(Terminal.inputBuffer);
  if (cmd.flags.length == 0 || cmd.flags[0].length < 2) {
    return {
      type: "string",
      content: "SYNTAX ERROR",
      //   content: Terminal.Kernel.ErrorChip.GetError(),
      colour: 14,
    };
  }

  let colour = parseInt(cmd.flags[0].slice(1));
  if (colour == NaN || colour > 15) colour = 7;

  return {
    type: "string",
    content: cmd.content.join(""),
    colour: colour,
  };
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

module.exports = {
  Welcome,
  Echo,
  Colour,
  Edit,
  MakeDirectory,
  ListDirectory,
  ChangeDirectory,
  Touch,
};
