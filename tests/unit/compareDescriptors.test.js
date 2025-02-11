// tests/unit/compareDescriptors.test.js
const { compareDescriptors } = require('../../utilities/ir/compareDescriptors');
const faceapi = require('../../utilities/ir/faceApiSetup');

// Override euclideanDistance with a simple implementation for testing.
jest.spyOn(faceapi, 'euclideanDistance').mockImplementation((desc1, desc2) => {
  // For testing: sum of absolute differences
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.abs(desc1[i] - desc2[i]);
  }
  return sum;
});

describe('compareDescriptors', () => {
  it('should return true when distance is below threshold', () => {
    const descriptor1 = new Float32Array([0.1, 0.2, 0.3]);
    const descriptor2 = new Float32Array([0.1, 0.2, 0.3]);
    const result = compareDescriptors(descriptor1, descriptor2);
    expect(result).toBe(true);
  });

  it('should return false when distance is above threshold', () => {
    const descriptor1 = new Float32Array([0.1, 0.2, 0.3]);
    const descriptor2 = new Float32Array([1, 1, 1]);
    const result = compareDescriptors(descriptor1, descriptor2, 0.5);
    expect(result).toBe(false);
  });
});
