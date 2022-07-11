const { TOKENS, Error, Token } = require("./tokens");

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
    if (this.readIndex >= this.fileString.length) this.char = "";
    else this.char = this.fileString[this.readIndex];

    this.index = this.readIndex;
    this.readIndex++;
  }

  Lex() {
    let tokens = [];
    while (this.char != "") {
      let tok,
        err = this.lexAhead();
      if (err != null) return [], err;
      tokens.push(tok);
    }
    return tokens, null;
  }

  lexAhead() {
    let token = null;
    let err = null;
    this.eatWhitespace();

    switch (this.char) {
      default:
        err = new Error(
          "SYNTAX ERROR LINE " + this.lineNumber + " CHAR " + this.char
        );
    }
    this.advance();
    return token, err;
  }

  eatWhitespace() {
    while ((" ", "\t", "\r", "\n").includes(this.char)) {
      if (this.char == "\n") this.lineNumber++;
      this.advance();
    }
  }
}

module.exports = {
  Lexer,
};
