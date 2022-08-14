const { TOKENS, Error, Token, LETTERS, DIGITS, lookupIdentifier } = require("./tokens");

class Lexer {
  constructor(fileString) {
    this.fileString = fileString;
    this.index = 0;
    this.readIndex = 1;
    this.lineNumber = 1;
    this.char = this.fileString[this.index];

    this.error = "";
  }

  advance() {
    // IF NEXT CHAR TO BE READ DOESN'T EXIST (EOF)
    if (this.readIndex >= this.fileString.length)
      this.char = TOKENS.EOF; // "" = placeholder for EOF: hack
    else this.char = this.fileString[this.readIndex];

    this.index = this.readIndex;
    this.readIndex++;
  }

  previous() {
    if (this.readIndex > 0) {
      this.readIndex--;
      this.index--;
      this.char = this.fileString[this.index];
    }
  }

  // USED IN MULTICHAR (CHECK NEXT CHAR w/o ADVANCING)
  peek() {
    if (this.readIndex >= this.fileString.length) return TOKENS.EOF; // IF CHAR EXISTS
    return this.fileString[this.readIndex];
  }

  Lex(ignore) {
    let tokens = [];
    while (this.char != TOKENS.EOF) {
      // LOOP UNTIL EOF : "" = placeholder for EOF
      let [tok, err] = this.lexAhead();
      if (err != null && !ignore) return [tokens, err]
      tokens.push(tok);
    }
    tokens.push(new Token(TOKENS.EOF, "EOF", this.lineNumber));
    return [tokens, null];
  }

  lexAhead() {
    let token = null;
    let err = null;
    this.eatWhitespace();

    switch (this.char) {
      case "+":
        token = new Token(TOKENS.ADD, this.char, this.lineNumber);
        break;

      case "-":
        if (this.peek() == "-") 
          token = this.lexComment()
        else 
          token = new Token(TOKENS.SUB, this.char, this.lineNumber);

        break;

      case "*":
        token = new Token(TOKENS.MUL, this.char, this.lineNumber);
        break;

      case "/":
        token = new Token(TOKENS.DIV, this.char, this.lineNumber);
        break;

      case "%":
        token = new Token(TOKENS.MOD, this.char, this.lineNumber);
        break;

      case "^":
        token = new Token(TOKENS.POW, this.char, this.lineNumber);
        break;

      case "(":
        token = new Token(TOKENS.LPAREN, this.char, this.lineNumber);
        break;

      case ")":
        token = new Token(TOKENS.RPAREN, this.char, this.lineNumber);
        break;

      case "[":
        token = new Token(TOKENS.LSQUARE, this.char, this.lineNumber);
        break;

      case "]":
        token = new Token(TOKENS.RSQUARE, this.char, this.lineNumber);
        break;

      case "{":
        token = new Token(TOKENS.LBRACE, this.char, this.lineNumber);
        break;

      case "}":
        token = new Token(TOKENS.RBRACE, this.char, this.lineNumber);
        break;

      case ",":
        token = new Token(TOKENS.COMMA, this.char, this.lineNumber);
        break;

      case ".":
        token = new Token(TOKENS.DOT, this.char, this.lineNumber);
        break;

      case "\n":
        token = new Token(TOKENS.NEW_LINE, "\n", this.lineNumber)
        this.lineNumber++;
        break

      case "\t":
        token = new Token(TOKENS.TAB, "\t", this.lineNumber)
        break;

      case " ":
        token = new Token(TOKENS.SPACE, " ", this.lineNumber)
        break;

      case ";": //TODO: REMOVE IF NOT USING SEMI's
        token = new Token(TOKENS.SEMICOLON, this.char, this.lineNumber);
        break;

      case ":": //TODO: REMOVE IF NOT USING SEMI's
        token = new Token(TOKENS.COLON, this.char, this.lineNumber);
        break;

      case "=":
        token = this.lexMultichar(TOKENS.EQ, "=", TOKENS.EE);
        break;

      case "!":
        token = this.lexMultichar(TOKENS.BANG, "=", TOKENS.NE);
        break;

      case ">":
        token = this.lexMultichar(TOKENS.GT, "=", TOKENS.GTE);
        break;

      case "<":
        token = this.lexMultichar(TOKENS.LT, "=", TOKENS.LTE);
        break;


      case "'":
      case '"':
        [token, err] = this.lexString(this.char);
        break;

      default:
        if (LETTERS.includes(this.char)) {
          return this.lexIdentifier();
        } else if (DIGITS.includes(this.char)) {
          return this.lexNumber();
        } else {
          err = new Error(
            "SYNTAX ERROR LINE " + this.lineNumber + " CHAR " + this.char
          );
        }
    }

    this.advance();
    return [token, err];
  }

  eatWhitespace() {
    while (["\r"].includes(this.char)) {
    //while ([" ", "\t", "\r"].includes(this.char)) {
      //if (this.char == "\n") this.lineNumber++;
      this.advance();
    }
  }

  lexMultichar(primaryType, secondaryChar, secondaryType) {
    let primaryChar = this.char;
    if (this.peek() == secondaryChar) {
      this.advance();
      return new Token(secondaryType, primaryChar + this.char, this.lineNumber);
    }
    return new Token(primaryType, primaryChar, this.lineNumber);
  }

  lexNumber() {
    //TODO: HANDLE FLOATING POINTS
    let number = "";
    while ((DIGITS + ".").includes(this.char)) {
      number += this.char;
      this.advance();
    }

    let [validated, validatedErr] = this.validateNumber(number)
    if (validatedErr != null) return [validated, validatedErr]
    return [new Token(TOKENS.NUMBER, validated, this.lineNumber), null];
  }

  validateNumber(number) {
    // IF MORE THAN ONE '.' -> ERR
    if (number.split(".").length - 1 > 1) {
      return [
        number, 
        new Error("SYNTAX ERROR, LINE " + this.lineNumber + " > 1 '.' IN NUMBER: " + number)
      ]
    } else if (number[-1] == ".") {
    // IF LAST NUMBER = '.' -> ERR
      return [
        number, 
        new Error("SYNTAX ERROR, LINE " + this.lineNumber + " DECIMAL PLACE TERMINATING NUMBER:" + number)
      ]
    }
    
    return [number, null]
  }

  lexIdentifier() {
    let identifier = "";
    while (LETTERS.includes(this.char)) {
      identifier += this.char;
      this.advance();
    }
    return lookupIdentifier(new Token(TOKENS.IDENTIFIER, identifier, this.lineNumber))
    //return [new Token(TOKENS.IDENTIFIER, identifier, this.lineNumber), null];
  }

  lexString(terminator) {
    if (["\n", TOKENS.EOF].includes(this.peek())) 
        return [
          new Token(TOKENS.STRING, terminator, this.lineNumber),
          new Error(
            "SYNTAX ERROR LINE " +
              this.lineNumber +
              "\nMISSING STRING TERMINATOR " +
              terminator
          ),
        ];

    //this.advance();
    let lexedString = terminator;
    this.advance()

    while (this.char != terminator) {
      if (this.peek() == "EOF" || this.peek() == "\n") {
        if (this.peek() == "\n") lexedString += this.char
        // IF EOF w/o string terminating:
        return [
          new Token(TOKENS.STRING, lexedString, this.lineNumber),
          new Error(
            "SYNTAX ERROR LINE " +
              this.lineNumber +
              "\nMISSING STRING TERMINATOR " +
              terminator
          ),
        ];
      }
      lexedString += this.char;
      this.advance();
    }

    lexedString += terminator
    //this.advance();
    return [new Token(TOKENS.STRING, lexedString, this.lineNumber), null];
  }

  lexComment() {
    this.advance();

    if (["\n", TOKENS.EOF].includes(this.peek())) 
      return new Token(TOKENS.COMMENT, "--", this.lineNumber)

    this.advance()
    let lexedString = "--";

    while (!["\n", TOKENS.EOF].includes(this.peek())) {
      lexedString += this.char;
      this.advance();
    }

    lexedString += this.char
    //this.advance();
    return new Token(TOKENS.COMMENT, lexedString, this.lineNumber)
  }
}

module.exports = {
  Lexer,
};
