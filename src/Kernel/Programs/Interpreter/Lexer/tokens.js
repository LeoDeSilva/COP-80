const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_";
const DIGITS = "0123456789";

const KEYWORDS = {
    LOCAL: "LOCAL",
    RETURN: "RETURN",
    IF: "IF",
    ELSE: "ELSE",
    ELIF: "ELIF",
    FOR: "FOR",
    IN: "IN",
    WHILE: "WHILE",
    FN: "FN",
    IMPORT: "IMPORT",

    END: "END",
    THEN: "THEN",
    DO: "DO",
    GO: "GO",

    AND: "AND",
    OR: "OR",
}

class Token {
  constructor(Type, Literal, LineNumber) {
    this.Type = Type;
    this.Literal = Literal;
    this.LineNumber = LineNumber;
  }
}

class Error {
  constructor(msg) {
    this.msg = msg;
  }
}

function lookupIdentifier(identifier) {
  if (identifier.Literal.length == 0) {
    return [
      null, 
      new Error("LOOKUP ERROR LINE " + identifier.LineNumber + ": EXPECTED STRING LENGTH > 0")
    ]
  }

  if (KEYWORDS[identifier.Literal] != null) {
    return [new Token(KEYWORDS[identifier.Literal], identifier.Literal, identifier.LineNumber)]
  }

  return [identifier, null]
}

module.exports = {
  TOKENS: {
    //WRAPPERS
    PROGRAM: "PROGRAM",
    BINARY_OP: "BINARY_OP",
    UNARY_OP: "UNARY_OP",
    ASSIGN: "ASSIGN",
    PREDEFINED: "PREDEFINED",

      
    //DATA TYPES
    STRING: "STRING",
    TABLE: "TABLE",
    NUMBER: "NUMBER",
    IDENTIFIER: "IDENTIFIER",
    FUNCTION: "FUNCTION",
    INVOKE: "INVOKE",
    KEYWORD: "KEYWORD",
    COMMENT: "COMMENT",

    GLOBAL: "GLOBAL",

    //KEYWORDS
    LOCAL: "LOCAL",
    RETURN: "RETURN",
    IF: "IF",
    ELSE: "ELSE",
    IMPORT: "IMPORT",
    ELIF: "ELIF",
    FOR: "FOR",
    WHILE: "WHILE",
    FN: "FN",
    INDEX: "INDEX",

    END: "END",
    THEN: "THEN",
    DO: "DO",
    IN: "IN",
    GO: "GO",

    AND: "AND",
    OR: "OR",

    ARRAY: "ARRAY",

    //UNPRINTABLES
    EOF: "EOF",
    NEW_LINE: "NEW_LINE",
    TAB: "TAB",
    SPACE: "SPACE",
    NULL: "NULL",

    // BRACKETS
    LPAREN: "LPAREN",
    RPAREN: "RPAREN",
    LSQUARE: "LSQUARE",
    RSQUARE: "RSQUARE",
    RBRACE: "RBRACE",
    LBRACE: "LBRACE",
    BANG: "BANG",

    EQ: "EQ",
    COMMA: "COMMA",
    DOT: "DOT",
    SEMICOLON: "SEMICOLON",
    COLON: "COLON",

    // OPERATIONS
    ADD: "ADD",
    SUB: "SUB",
    DIV: "DIV",
    MUL: "MUL",

    MOD: "MOD",
    POW: "POW",

    LT: "LT",
    LTE: "LTE",
    GT: "GT",
    GTE: "GTE",
    EE: "EE",
    NE: "NE",
  },
  Token,
  Error,
  LETTERS,
  DIGITS,
  KEYWORDS,
  lookupIdentifier,
};
