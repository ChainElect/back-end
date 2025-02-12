const faceapi = require("./faceApiSetup");

/**
 * @summary Compares two face descriptors using Euclidean distance.
 * @description If the distance between the descriptors is below the specified threshold,
 * the function returns true, indicating a match.
 *
 * @param {Float32Array} descriptor1 - The first face descriptor.
 * @param {Float32Array} descriptor2 - The second face descriptor.
 * @param {number} [threshold=0.6] - The matching threshold.
 * @returns {boolean} True if the descriptors match (distance is below threshold), else false.
 */
const compareDescriptors = (descriptor1, descriptor2, threshold = 0.6) => {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  console.log(`Distance between descriptors: ${distance}`);
  return distance < threshold;
};

module.exports = {
  compareDescriptors,
};
