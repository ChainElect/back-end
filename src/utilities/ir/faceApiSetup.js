/**
 * @module faceApiSetup
 * @description Configures face-api.js to use the 'canvas' package for image manipulation in a Node.js environment.
 */

const { Canvas, Image, ImageData } = require("canvas");
const faceapi = require("face-api.js");

// Register the canvas implementation with face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

module.exports = faceapi;
