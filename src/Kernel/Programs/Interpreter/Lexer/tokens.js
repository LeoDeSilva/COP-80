class Token {
  constructor(Type, Literal) {
    this.Type = Type;
    this.Literal = Literal;
  }
}

class Error {
  constructor(msg) {
    this.msg = msg;
  }
}

module.exports = {
  TOKENS: {
    EOF: "EOF",
  },
  Token,
  Error,
};
