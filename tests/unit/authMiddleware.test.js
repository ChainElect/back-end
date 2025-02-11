// tests/unit/authMiddleware.test.js
process.env.JWT_SECRET = "test-secret"; // set a test secret

const authMiddleware = require("../../middlewares/authMiddleware");
const jwt = require("jsonwebtoken");

// Update the jwt.verify mock to be synchronous
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn((token, secret) => {
    // Simulate a successful verification
    return { userId: 1, isAdmin: true };
  }),
}));

describe("Auth Middleware", () => {
  it("should be a function", () => {
    expect(typeof authMiddleware).toBe("function");
  });

  it("should call next() when a valid token is provided", () => {
    const req = {
      headers: { authorization: "Bearer valid.token.here" },
      header(name) {
        return this.headers[name.toLowerCase()];
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
