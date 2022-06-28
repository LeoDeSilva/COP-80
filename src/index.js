const { Kernel } = require("./Kernel/kernel");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let kernel = new Kernel(window.innerHeight);

function resize() {
  kernel.DisplayChip.PIXEL_SIZE = Math.floor(
    window.innerHeight / kernel.DisplayChip.PIXEL_DENSITY
  ); // PIXELSIZE = HEIGHT / NUMBER OF PIXELS IN HEIGHT

  canvas.width =
    kernel.DisplayChip.PIXEL_SIZE * kernel.DisplayChip.PIXEL_DENSITY; //- renderer.PIXEL_SIZE; // PIXEL SIZE * NUM OF PIXELS (-1 SINCE FROM 0)
  canvas.height =
    kernel.DisplayChip.PIXEL_SIZE * kernel.DisplayChip.PIXEL_DENSITY; //- renderer.PIXEL_SIZE;
}

function main() {
  resize();
  window.addEventListener("resize", resize);

  setInterval(() => {
    kernel.Update();
  }, 30); // FRAMERATE
}

main();
