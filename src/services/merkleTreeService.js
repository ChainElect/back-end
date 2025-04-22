/**
 * @module merkleTreeService
 * @description Service for Merkle tree operations used in zero-knowledge proofs.
 */

const crypto = require('crypto');

// Constants
const TREE_LEVELS = 20;
const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

/**
 * Generates a hash using sha256
 * @param {string|Buffer} input - The input to hash
 * @returns {string} - The hash as a hex string
 */
const hashFunction = (input) => {
  const hash = crypto.createHash('sha256');
  hash.update(typeof input === 'string' ? input : input.toString());
  return hash.digest('hex');
};

/**
 * Calculates the hash of two child nodes in a Merkle tree
 * @param {string} left - The left child hash
 * @param {string} right - The right child hash
 * @returns {string} - The parent hash
 */
const hashLeftRight = (left, right) => {
  const combined = Buffer.concat([
    Buffer.from(left, 'hex'),
    Buffer.from(right, 'hex')
  ]);
  return hashFunction(combined);
};

/**
 * Generates the zero elements for the Merkle tree
 * @param {number} levels - The number of levels in the tree
 * @returns {Array<string>} - Array of zero elements
 */
const generateZeros = (levels) => {
  const zeros = Array(levels + 1);
  zeros[0] = hashFunction('0');
  for (let i = 1; i <= levels; i++) {
    zeros[i] = hashLeftRight(zeros[i - 1], zeros[i - 1]);
  }
  return zeros;
};

/**
 * Inserts an element into the Merkle tree and returns the updated root and path
 * @param {Array<string>} elements - Current elements in the tree
 * @param {string} newElement - Element to add to the tree
 * @returns {Object} - Root hash and path information
 */
const insertElement = (elements, newElement) => {
  const zeros = generateZeros(TREE_LEVELS);
  const currentElements = [...elements, newElement];
  
  let layers = [];
  layers.push(currentElements);

  // Build the tree
  for (let level = 0; level < TREE_LEVELS; level++) {
    layers.push([]);
    for (let i = 0; i < Math.ceil(layers[level].length / 2); i++) {
      const left = layers[level][i * 2];
      const right = i * 2 + 1 < layers[level].length ? layers[level][i * 2 + 1] : zeros[level];
      layers[level + 1].push(hashLeftRight(left, right));
    }
  }

  // Get the root
  const root = layers[TREE_LEVELS][0];

  // Get the path for the new element
  const pathElements = [];
  const pathIndices = [];
  let index = currentElements.length - 1;

  for (let level = 0; level < TREE_LEVELS; level++) {
    const isRight = index % 2;
    const siblingIndex = isRight ? index - 1 : index + 1;
    
    if (siblingIndex < layers[level].length) {
      pathElements.push(layers[level][siblingIndex]);
    } else {
      pathElements.push(zeros[level]);
    }
    
    pathIndices.push(isRight ? 0 : 1);
    index = Math.floor(index / 2);
  }

  return {
    root,
    pathElements,
    pathIndices
  };
};

/**
 * Verifies if an element is part of the Merkle tree
 * @param {string} root - The Merkle root
 * @param {string} element - Element to verify
 * @param {Array<string>} pathElements - Path elements
 * @param {Array<number>} pathIndices - Path indices (0 for left, 1 for right)
 * @returns {boolean} - True if the element is part of the tree
 */
const verifyElement = (root, element, pathElements, pathIndices) => {
  let currentHash = element;

  for (let i = 0; i < pathElements.length; i++) {
    if (pathIndices[i] === 0) {
      currentHash = hashLeftRight(pathElements[i], currentHash);
    } else {
      currentHash = hashLeftRight(currentHash, pathElements[i]);
    }
  }

  return currentHash === root;
};

module.exports = {
  TREE_LEVELS,
  FIELD_SIZE,
  hashFunction,
  hashLeftRight,
  generateZeros,
  insertElement,
  verifyElement,
};