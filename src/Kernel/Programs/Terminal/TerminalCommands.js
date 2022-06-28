const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "1234567890";
const PRINTABLES = "!@£$%^&*()_-=+[]{}\\'\"/?.,><#`" + ALPHABET;

function Welcome(Terminal) {
  return [
    {
      type: "function",
      content: (Kernel) => {
        Kernel.Icons["cop-80-icon"].Blit(Kernel.DisplayChip, 0, 0);
        return Kernel.Icons["cop-80"].Blit(
          Kernel.DisplayChip,
          Kernel.Icons["cop-80-icon"].width + 1,
          0
        );
      },
      colour: 0,
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

        i++;
        while (command[i] != quote) {
          tempString += command[i];
          i++;
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
};
