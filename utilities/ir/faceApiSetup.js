// utilities/ir/faceApiSetup.js
const { Canvas, Image, ImageData } = require("canvas");
const faceapi = require("face-api.js");

// Register the canvas implementation with face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

module.exports = faceapi;
