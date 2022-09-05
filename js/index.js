const CONTENT = document.getElementById("content");
const NAV_LIST = document.getElementById("navlist");

function evalMarkdown(tokens) {
  content = "";

  for (let i = 0; i < tokens.length; i++) {
    switch (tokens[i].type) {
      case TOKENS.H1:
        content += "<h1>" + tokens[i].literal + "</h1>";
        content += "<div class='divider'></div>";
        break;
      case TOKENS.CODE:
        content += "<div class='code'>" + tokens[i].literal + "</div>";
        break;
      // case TOKENS.BR:
      //   content += "<br>";
      case TOKENS.BODY:
        content += "<p>" + tokens[i].literal + "</p>";
    }
  }
  console.log(content);
  return content;
}

function parseMarkdown(fileString) {
  let lexer = new Lexer(fileString.content);
  let [tokens, err] = lexer.lex();
  if (err != null) console.log(err);
  return evalMarkdown(tokens);
}

function Load(index) {
  NAV_LIST.innerHTML = "";
  for (let i = 0; i < CONTENTS.length; i++) {
    if (i == index)
      NAV_LIST.innerHTML +=
        "<div class='active btn' onClick='Load(" +
        i +
        ")'>" +
        CONTENTS[i].title +
        "</div>";
    else
      NAV_LIST.innerHTML +=
        "<div class='btn' onClick='Load(" +
        i +
        ")'>" +
        CONTENTS[i].title +
        "</div>";
  }
  CONTENT.innerHTML = parseMarkdown(CONTENTS[index]);
}

function main() {
  Load(0);
}

main();
