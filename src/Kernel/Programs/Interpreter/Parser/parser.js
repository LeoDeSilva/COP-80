const { TOKENS, Error, Token } = require("../Lexer/tokens");
const {
  ProgramNode,
  TableNode,
  IndexNode,
  FunctionNode,
  ForNode,
  ArrayNode,
  InvokeNode,
  NumberNode,
  WhileNode,
  StringNode,
  IfNode,
  ReturnNode,
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

  advance(skipNewLines=false) {
    this.index++;
    if (this.index >= this.tokens.length) return new Token(TOKENS.EOF, "");
    this.token = this.tokens[this.index];
    this.lineNumber = this.token.LineNumber;

    if ([TOKENS.COMMENT].includes(this.token.Type)) this.advance()
    if (skipNewLines) this.skip()
  }

  skip() {
    while (this.token.Type == TOKENS.NEW_LINE) {
      this.advance()
    }
   }

  peek(skipNewLines=false) {
    if (this.index + 1 >= this.tokens.length) return new Token(TOKENS.EOF, "");
    //if ([TOKENS.TAB, TOKENS.SPACE].includes(this.tokens[this.index + 1].Type)) this.advance()

    if (skipNewLines) {
      let i = 0;
      while (this.tokens[i].Type == TOKENS.NEW_LINE) {
        i = i + 1 
      }

      return this.tokens[i+1]
    }

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
      //if (![TOKENS.NEW_LINE, TOKENS.EOF].includes(this.token.Type)) {
      //   return [null, new Error("SYNTAX_ERROR: EXPECTING NEW LINE AT LINE " + this.lineNumber)];
      //} 
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

      case TOKENS.RETURN:
        this.advance()
        return this.parseReturn()

      case TOKENS.FOR:
        this.advance()
        return this.parseFor()

      case TOKENS.FN:
        this.advance()
        return this.parseFunction()

      case TOKENS.IDENTIFIER:
        if (this.peek().Type != TOKENS.EQ) break;
        return this.parseAssign(TOKENS.GLOBAL)

    }
    return this.parsePrattExpression(0); // 10, 10+10
  }

  parseReturn() {
    let [returnExpression, returnErr] = this.parsePrattExpression(0)
    if (returnErr != null) return [null, returnErr]

    return [new ReturnNode(this.lineNumber, returnExpression), null]
  }

  parseFunction() {
    if (this.token.Type != TOKENS.IDENTIFIER) {
      return [
        null, 
        new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED IDENTIFIER AFTER 'FN'")
      ]
    }

    let identifier = new IdentifierNode(this.lineNumber, this.token.Literal)
    this.advance()

    if (this.token.Type != TOKENS.LPAREN) {
      return [
        null, 
        new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED '(' AFTER IDENTIFIER")
      ]
    }

    let [parameters, paramErr] = this.parseParameters() // start parsing on ( end on )
    if (paramErr != null) return [null, paramErr]
    this.advance()

    if (this.token.Type != TOKENS.GO) return [
      null,
      new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED  KEYWORD: 'GO'")
    ]

    this.advance()

    let [block, blockErr] = this.parseUntil([TOKENS.END])
    if (blockErr != null) return [null, blockErr]

    this.advance()
    return [new FunctionNode(this.lineNumber, identifier, parameters, block)]
  }

  parseParameters() {
    let parameters = []
    this.advance()

    if (this.token.Type == TOKENS.RPAREN) {
      return [parameters, null] // continue on )
    }

    parameters.push(new IdentifierNode(this.lineNumber, this.token.Literal))
    this.advance()

    while (this.token.Type == TOKENS.COMMA) {
      this.advance()
      if (this.token.Type != TOKENS.IDENTIFIER) {
        return [
          null, 
          new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED IDENTIFIER AFTER 'FN'")
        ]
      }
      parameters.push(new IdentifierNode(this.lineNumber, this.token.Literal))
      this.advance()
    }

    if (this.token.Type != TOKENS.RPAREN) {
      return [
        null,
        new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED ) AFTER PARAMETERS")
      ]
    }

    return [parameters, null]
  }

  parseFor() {
    if (this.token.Type != TOKENS.IDENTIFIER) return [
      null,
      new Error("SYNTAX ERROR LINE " + this.lineNumber + " EXPECTED IDENTIFIER AFTER FOR")
    ]

    let identifier = this.token.Literal
    this.advance()

    if (this.token.Type != TOKENS.IN) return [
      null,
      new Error("SYNTAX ERROR LINE " + this.lineNumber + " EXPECTED 'IN' AFTER IDENTIFIER")
    ]

    this.advance()

    let [expr, exprErr] = this.parsePrattExpression(0)
    if (exprErr != null) return [null, exprErr]

    if (this.token.Type != TOKENS.DO) return [
      null,
      new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED  KEYWORD: 'DO' AFTER EXPRESSION")
    ]

    this.advance()
    let [consequence, consequenceErr] = this.parseUntil([TOKENS.END])
    if (consequenceErr != null) return [null, consequenceErr]
    this.advance()

    return [new ForNode(this.lineNumber, identifier, expr, consequence), null]
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
    return [new WhileNode(this.lineNumber, condition, consequence), null]
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
      //if (![TOKENS.NEW_LINE, TOKENS.EOF].includes(this.token.Type)) {
       //  return [null, new Error("SYNTAX_ERROR: EXPECTING NEW LINE AT LINE " + this.lineNumber)];
      //} 
      //this.advance()
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
        //if (this.token.Literal.match(/./g) || []).length == 1) parseFloat(this.token.Literal);
        if (this.token.Literal.split(".").length - 1 == 1) numberValue = parseFloat(this.token.Literal); 

        this.advance();
        return [new NumberNode(this.lineNumber, numberValue), null];

      case TOKENS.STRING:
        let stringValue = this.token.Literal
        this.advance()
        return [new StringNode(this.lineNumber, stringValue.slice(1,-1)), null]

      case TOKENS.IDENTIFIER:
        let identifier = this.token.Literal
        this.advance()
        return this.parsePostfix(new IdentifierNode(this.lineNumber, identifier))

      case TOKENS.LSQUARE:
        this.advance(true)
        let [elements, elementErr] = this.parseArguments(TOKENS.RSQUARE) 
        if (elementErr != null) return [null, elementErr]
        this.advance(true)
        return this.parsePostfix(new ArrayNode(this.lineNumber, elements))

      case TOKENS.LBRACE:
        return this.parseTable()

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

  parseTable() {
    this.advance(true)
    let table = new TableNode(this.lineNumber, {})

    while (this.token.Type != TOKENS.RBRACE) {
      if (this.token.Type == TOKENS.EOF) return [
        null, 
        new Error("LINE " + this.lineNumber + " EXPECTED } AFTER TABLE")
      ]

      if (![TOKENS.IDENTIFIER, TOKENS.STRING, TOKENS.NUMBER].includes(this.token.Type)) return [
        null,
        new Error("LINE " + this.lineNumber + " EXPECTED IDENTIFIER, STRING OR NUMBER AS TABLE KEY, GOT: " + this.token.Type)
      ]

      let key = this.token.Literal
  
      if (this.token.Type == TOKENS.STRING) key = key.slice(1,-1)

      this.advance()

      if (this.token.Type != TOKENS.COLON) return [
        null,
        new Error("LINE " + this.lineNumber + " EXPECTED COLON AFTER KEY IN TABLE")
      ]

      this.advance()
      let [expr, exprErr] = this.parsePrattExpression(0)

      if (exprErr != null) return [null, exprErr]

      if (this.token.Type != TOKENS.COMMA && this.peek(true) != TOKENS.RBRACE) return [
        null,
        new Error("LINE " + this.lineNumber + " EXPECTED COMMA AFTER EXPRESSION")
      ]

      this.advance(true)

      table.Table[key] = expr
    }

    this.advance()
    return [table, null]
  }

  parsePostfix(node) {
    switch (this.token.Type) {
      case TOKENS.LPAREN:
        this.advance(true)
        let [args, argErr] = this.parseArguments(TOKENS.RPAREN) 
        if (argErr != null) return [null, argErr]
        this.advance()
        return this.parsePostfix(new InvokeNode(this.lineNumber, node, args))

      case TOKENS.LSQUARE:
        this.advance(true)
        let [index, indexErr] = this.parsePrattExpression(0)  
        if (indexErr != null) return [null, indexErr]
        if (this.token.Type != TOKENS.RSQUARE) return [
          null,
          new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED: ] AFTER INDEX")
        ]
        this.advance()

        if (this.token.Type == TOKENS.EQ) {
          this.advance()
          let [expr, exprErr] = this.parsePrattExpression(0)
          if (exprErr != null) return [null, exprErr]
          return [new AssignNode(this.lineNumber, TOKENS.GLOBAL, new IndexNode(this.lineNumber, node, index), expr), null]
        }

        return this.parsePostfix(new IndexNode(this.lineNumber, node, index))
    }
    
    return [node, null]
  }

  parseArguments(terminator) {
    let args = []
    if (this.token.Type == terminator) {
      return [args, null] // continue on )
    }

    let [arg, argErr] = this.parsePrattExpression(0)  
    if (argErr != null) return [null, argErr]
    args.push(arg)

    while (this.token.Type == TOKENS.COMMA) {
      this.advance(true)
      let [arg, argErr] = this.parsePrattExpression(0)  
      if (argErr != null) return [null, argErr]
      args.push(arg)
    }
  
    this.skip()

    if (this.token.Type != terminator) {
      return [
        null,
        new Error("SYNTAX_ERROR LINE " + this.lineNumber + ", EXPECTED: " + terminator + " AFTER PARAMETERS")
      ]
    }

    return [args, null]
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
