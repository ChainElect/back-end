const faceapi = require("./faceApiSetup");

/**
 * Compares two face descriptors to determine if they match.
 *
 * @param {Float32Array} descriptor1 - First face descriptor.
 * @param {Float32Array} descriptor2 - Second face descriptor.
 * @param {number} [threshold=0.6] - Threshold for matching.
 * @returns {boolean} - True if the descriptors match, false otherwise.
 */
const compareDescriptors = (descriptor1, descriptor2, threshold = 0.6) => {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  console.log(`[DESCRIPTOR_COMPARISON]: Distance = ${distance}`);
  return distance < threshold;
};

module.exports = {
  compareDescriptors,
};
