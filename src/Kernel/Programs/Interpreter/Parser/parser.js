const { TOKENS, Error, Token } = require("../Lexer/tokens");
const {
  ProgramNode,
  NumberNode,
  WhileNode,
  StringNode,
  IfNode,
  IdentifierNode,
  AssignNode,
  BinaryOperationNode,
  PREFERENCES,
  BIN_OPERATIONS,
  UnaryOperationNode,
} = require("./nodes");

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.index = 0;
    this.token = this.tokens[this.index];
    this.lineNumber = 1;
  }

  advance() {
    this.index++;
    if (this.index >= this.tokens.length) return new Token(TOKENS.EOF, "");
    this.token = this.tokens[this.index];
    this.lineNumber = this.token.LineNumber;
  }

  peek() {
    if (this.index + 1 >= this.tokens.length) return new Token(TOKENS.EOF, "");
    return this.tokens[this.index + 1];
  }

  Parse() {
    let AST = new ProgramNode(this.lineNumber, []);
    while (this.token.Type != TOKENS.EOF) {
      //if ([TOKENS.NEW_LINE, TOKENS.EOF].includes(this.token.Type)) {
      if (this.token.Type == TOKENS.NEW_LINE) {
        this.advance();
        continue;
      }

      let [node, err] = this.parseExpression();
      if (err != null) return [null, err];
      if (![TOKENS.NEW_LINE, TOKENS.EOF].includes(this.token.Type)) {
         return [null, new Error("SYNTAX_ERROR: EXPECTING NEW LINE AT LINE " + this.lineNumber)];
      } 
      this.advance()
      AST.Nodes.push(node);
    }
    return [AST, null];
  }

  // expression = full command (print(), while, if)
  parseExpression() {
    switch (this.token.Type) {
      case TOKENS.LOCAL:
        this.advance()
        return this.parseAssign(TOKENS.LOCAL)

      case TOKENS.IF:
        return this.parseIf()

      case TOKENS.WHILE:
        this.advance()
        return this.parseWhile()

      case TOKENS.IDENTIFIER:
        if (this.peek().Type != TOKENS.EQ) break;
        return this.parseAssign(TOKENS.GLOBAL)

    }
    return this.parsePrattExpression(0); // 10, 10+10
  }

  parseWhile() {
    let [condition, conditionErr] = this.parsePrattExpression(0)
    if (conditionErr != null) return [null, conditionErr]

    if (this.token.Type != TOKENS.DO) return [
      null,
      new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED  KEYWORD: 'DO'")
    ]

    this.advance()
    let [consequence, consequenceErr] = this.parseUntil([TOKENS.END])
    if (consequenceErr != null) return [null, consequenceErr]

    this.advance()
    return [new WhileNode(this.LineNumber, condition, consequence), null]
  }

  parseIf() { 
    let ifNode = new IfNode(this.lineNumber)

    while ([TOKENS.IF, TOKENS.ELIF, TOKENS.ELSE].includes(this.token.Type)) {
      if ([TOKENS.IF, TOKENS.ELIF].includes(this.token.Type)) {
        this.advance()

        let [condition, conditionErr] = this.parsePrattExpression(0)
        if (conditionErr != null) return [null, conditionErr]

        if (this.token.Type != TOKENS.THEN) return [
          null, 
          new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED  KEYWORD: 'THEN'")
        ]

        this.advance()
        let [consequence, consequenceErr] = this.parseUntil([TOKENS.END, TOKENS.ELSE, TOKENS.ELIF])
        if (consequenceErr != null) return [null, consequenceErr]

        ifNode.Conditionals.push([condition, consequence])
      } else {
        this.advance()

        let [consequence, consequenceErr] = this.parseUntil([TOKENS.END, TOKENS.ELSE, TOKENS.ELIF])
        if (consequenceErr != null) return [null, consequenceErr]

        ifNode.Alternative = consequence
      }

    }

    this.advance()
    return [ifNode, null] 
  }

  parseUntil(TERMINATORS) {
    let Block = new ProgramNode(this.lineNumber, []);
    while (!TERMINATORS.includes(this.token.Type)) {
      if (this.token.Type == TOKENS.EOF) return [
        null, 
        new Error("SYNTAX ERROR LINE " + this.token.LineNumber + ", EXPECTED END AFTER IF STATEMENT")
      ]
      //if ([TOKENS.NEW_LINE, TOKENS.EOF].includes(this.token.Type)) {
      if (this.token.Type == TOKENS.NEW_LINE) {
        this.advance();
        continue;
      }

      let [node, err] = this.parseExpression();
      if (err != null) return [null, err];
      if (![TOKENS.NEW_LINE, TOKENS.EOF].includes(this.token.Type)) {
         return [null, new Error("SYNTAX_ERROR: EXPECTING NEW LINE AT LINE " + this.lineNumber)];
      } 
      this.advance()
      Block.Nodes.push(node);
    }
    return [Block, null];
  }

  parseAssign(Scope) {
    let [Left, LeftErr] = this.parsePrefix()
    if (LeftErr != null) return [null, LeftErr]

    this.advance()

    let [Right, RightErr] = this.parsePrattExpression(0) 
    if (RightErr != null) return [null, RightErr]

    return [new AssignNode(this.lineNumber, Scope, Left, Right), null]
  }

  parsePrattExpression(rbp) {
    let [left, err] = this.parsePrefix(); // e.g. number, identifier
    if (err != null) return [null, err];
     // current binding preference, enables BIDMAS
    let peek_rbp = this.getPreference(this.token.Type);

    while (this.peek().Type != TOKENS.EOF && peek_rbp >= rbp) {
      [left, err] = this.parseInfix(left, this.token.Type); // INFIX = 10 + 10
      if (err != null) return [null, err];
      peek_rbp = this.getPreference(this.token.Type);
    }
    return [left, null];
  }

  parsePrefix() {
    switch (this.token.Type) {
      case TOKENS.SUB:
      case TOKENS.BANG:
        return [this.parseUnary(), null];

      case TOKENS.LPAREN:
        this.advance();
        let [expression, err] = this.parsePrattExpression(
          this.getPreference(TOKENS.LPAREN)
        );

        if (err != null) return [null, err];
        this.advance();
        return [expression, null];

      case TOKENS.NUMBER:
        let numberValue = parseInt(this.token.Literal);
        this.advance();
        return [new NumberNode(this.lineNumber, numberValue), null];

      case TOKENS.STRING:
        let stringValue = this.token.Literal
        this.advance()
        return [new StringNode(this.lineNumber, stringValue), null]

      case TOKENS.IDENTIFIER:
        let identifier = this.token.Literal
        this.advance()
        return [new IdentifierNode(this.lineNumber, identifier), null]

      default:
        return [
          null,
          new Error(
            "Parser_Error: Unexpected prefix at line " +
              this.lineNumber +
              " prefix: " +
              this.token.Literal
          ),
        ];
    }
  }

  parseUnary() {
    let operation = this.token.Type;
    this.advance();
    let [expression, err] = this.parsePrefix();
    if (err != null) return [null, err];
    return new UnaryOperationNode(this.lineNumber, operation, expression);
  }

  parseInfix(left, operation) {
    if (!BIN_OPERATIONS.includes(operation)) {
       console.log("err")
      return [
        null,
        new Error(
          "Syntax_error, Line " +
            this.lineNumber +
            " unsuported operator: " +
            operation
        ),
      ];
    }

    this.advance();
    let [right, err] = this.parsePrattExpression(
      this.getPreference(operation) + 1
    );
    if (err != null) return [null, err];
    return [
      new BinaryOperationNode(this.lineNumber, left, operation, right),
      null,
    ];
  }

  getPreference(type) {
    if (PREFERENCES[type] != undefined) {
      return PREFERENCES[type];
    }
    return -1;
  }
}

module.exports = {
  Parser,
};
