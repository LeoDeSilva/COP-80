class ErrorChip {
  constructor() {
    this.Errors = ["Wanna try typing better?"];
  }

  GetError() {
    return this.Errors[Math.floor(Math.random() * this.Errors.length)];
  }
}

module.exports = {
  ErrorChip,
};
