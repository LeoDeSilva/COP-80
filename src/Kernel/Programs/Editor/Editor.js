class Editor {
  constructor(Kernel, fileName) {
    this.Kernel = Kernel;
    this.fileName = fileName;
    this.fileData = "if (index == 10) {\n\tprint('hello world');\n}";
  }

  Start() {}

  Update() {
    this.Kernel.DisplayChip.FillScreen(0);
    this.Kernel.DisplayChip.Rect(0, 0, 128, 9, 7);
    this.Kernel.FontChip.BlitText(
      this.Kernel.DisplayChip,
      this.fileName,
      2,
      2,
      0
    );

    this.Kernel.FontChip.BlitTextWrap(
      this.Kernel.DisplayChip,
      this.fileData,
      3,
      9 + 3,
      7,
      true
    );
  }
}

module.exports = {
  Editor,
};
