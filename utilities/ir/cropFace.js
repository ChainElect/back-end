const canvas = require("canvas");
const fs = require("fs");

// Helper: Crop detected face from image
const cropFace = async (imageCanvas, faceRegion, outputPath) => {
  try {
    const { x, y, width, height } = faceRegion;
    const croppedCanvas = canvas.createCanvas(width, height);
    const croppedCtx = croppedCanvas.getContext("2d");

    croppedCtx.drawImage(imageCanvas, x, y, width, height, 0, 0, width, height);

    // Save cropped face
    const out = fs.createWriteStream(outputPath);
    const stream = croppedCanvas.createJPEGStream();
    stream.pipe(out);

    await new Promise((resolve) => out.on("finish", resolve));
  } catch (error) {
    console.error(`Failed to crop face to: ${outputPath}`, error);
    throw new Error("Face cropping failed.");
  }
};

module.exports = cropFace;
