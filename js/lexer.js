TOKENS = {
  EOF: "EOF",
  H1: "H1",
  BR: "BR",
  BODY: "BODY",
  CODE: "CODE",
};

class Token {
  constructor(type, literal) {
    this.type = type;
    this.literal = literal;
  }
}

class Lexer {
  constructor(fileString) {
    this.fileString = fileString;
    this.index = 0;
    this.readIndex = 1;
    this.lineNumber = 1;
    this.char = fileString[0];
    this.tokens = [];
  }

  advance() {
    if (this.readIndex >= this.fileString.length) this.char = TOKENS.EOF;
    else this.char = this.fileString[this.readIndex];

    this.index = this.readIndex;
    this.readIndex++;
  }

  lex() {
    while (this.char != TOKENS.EOF) {
      let err = this.lexAhead();
      if (err != null) return [null, err];
    }

    return [this.tokens, null];
  }

  lexAhead() {
    let token = null;
    let err = null;

    switch (this.char) {
      case "#":
        this.advance();
        token = new Token(TOKENS.H1, this.lexUntil("\n"));

        this.tokens.push(token);
        this.tokens.push(new Token(TOKENS.BR, "\n"));
        this.advance();
        return err;

      case "\n":
        this.advance();
        this.tokens.push(new Token(TOKENS.BR, "\n"));
        return err;

      case "`":
        this.advance();
        token = new Token(TOKENS.CODE, this.lexUntil("`"));
        this.tokens.push(token);
        this.tokens.push(new Token(TOKENS.BR, "\n"));
        this.advance();

      default:
        token = new Token(TOKENS.BODY, this.lexUntil("\n"));
        this.tokens.push(token);
        this.tokens.push(new Token(TOKENS.BR, "\n"));
        this.advance();
        return err;
    }
  }

  lexUntil(char) {
    let string = "";
    while (this.char != char && this.char != TOKENS.EOF) {
      string += this.char;
      this.advance();
    }

    return string;
  }
}
