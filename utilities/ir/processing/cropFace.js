const { createCanvas } = require("canvas");
const fs = require("fs");
const { ERROR_MESSAGES } = require("../../messages/errorMessages");

/**
 * Crops a detected face region from the provided image canvas and saves it as a file.
 *
 * @param {Canvas} imageCanvas - The source image loaded onto a Canvas object.
 * @param {Object} faceRegion - The region of the face to crop (x, y, width, height).
 * @param {string} outputPath - The file path where the cropped image should be saved.
 * @returns {Promise<void>} Resolves when the cropped image has been saved.
 * @throws {Error} Throws an error if cropping or saving the image fails.
 */
const cropFace = async (imageCanvas, faceRegion, outputPath) => {
  try {
    const { x, y, width, height } = faceRegion;
    const croppedCanvas = createCanvas(width, height);
    const croppedCtx = croppedCanvas.getContext("2d");

    croppedCtx.drawImage(imageCanvas, x, y, width, height, 0, 0, width, height);

    const outputStream = fs.createWriteStream(outputPath);
    const jpegStream = croppedCanvas.createJPEGStream();
    jpegStream.pipe(outputStream);

    await new Promise((resolve, reject) => {
      outputStream.on("finish", resolve);
      outputStream.on("error", reject);
    });
  } catch (error) {
    console.error("[CROP_FACE_ERROR]: Failed to crop face.", {
      outputPath,
      error: error.message,
    });
    throw new Error(ERROR_MESSAGES.IR.FACE_CROPPING_FAILED);
  }
};

module.exports = cropFace;
