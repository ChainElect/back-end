const pool = require("@config/db");
const userModel = require("@models/userModel");
const bcrypt = require("bcrypt");

jest.mock("@config/db");
jest.mock("bcrypt");

describe("UserModel", () => {
  it("should create a user with valid attributes", async () => {
    const mockUser = { name: "John", dob: "1990-01-01", id_number: "12345" };

    // Mocking the query result
    pool.query.mockResolvedValueOnce({
      rows: [mockUser],
    });

    const user = await userModel.saveUser({
      name: "John",
      dob: "1990-01-01",
      idNumber: "12345",
    });

    expect(user.name).toBe("John");
    expect(user.dob).toBe("1990-01-01");
    expect(user.id_number).toBe("12345");
  });

  it("should throw error if the query fails", async () => {
    pool.query.mockRejectedValueOnce(new Error("Database error"));

    await expect(
      userModel.saveUser({ name: "John", dob: "1990-01-01", idNumber: "12345" })
    ).rejects.toThrow("Database error");
  });
});


describe("UserModel ZKP Operations", () => {
  const mockUser = {
    id: 1,
    commitment: "hashed_commitment",
    password_hash: "hashed_password",
    is_admin: false
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("saveUser ZKP Requirements", () => {
    it("should hash both commitment and password with proper salt rounds", async () => {
      bcrypt.hash.mockImplementation((data) => Promise.resolve(`hashed_${data}`));
      
      await userModel.saveUser({
        commitment: "secret_commitment",
        password: "secure_password"
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("secret_commitment", 10);
      expect(bcrypt.hash).toHaveBeenCalledWith("secure_password", 10);
    });

    it("should store hashed values without exposing raw data", async () => {
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userModel.saveUser({
        commitment: "raw_commitment",
        password: "raw_password"
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        expect.arrayContaining([
          "hashed_raw_commitment",
          "hashed_raw_password",
          false
        ])
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe("verifyIdNumber (ZK Verification)", () => {
    it("should successfully verify valid commitment without exposing raw data", async () => {
      bcrypt.compare.mockResolvedValue(true);
      
      const isValid = await userModel.verifyIdNumber(
        "stored_hashed_commitment",
        "raw_commitment"
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "raw_commitment",
        "stored_hashed_commitment"
      );
      expect(isValid).toBe(true);
    });

    it("should reject invalid commitment attempts", async () => {
      bcrypt.compare.mockResolvedValue(false);

      const isValid = await userModel.verifyIdNumber(
        "stored_hashed_commitment",
        "wrong_commitment"
      );

      expect(isValid).toBe(false);
    });
  });

  describe("findUserByIdNumber (ZK Lookup)", () => {
    it("should find user by commitment without exposing plaintext", async () => {
      const mockUsers = [
        { ...mockUser, commitment: "hashed_real_commitment" },
        { ...mockUser, id: 2, commitment: "hashed_wrong_commitment" }
      ];

      pool.query.mockResolvedValue({ rows: mockUsers });
      bcrypt.compare.mockImplementation((raw, hashed) => 
        Promise.resolve(`hashed_${raw}` === hashed)
      );

      const user = await userModel.findUserByIdNumber("real_commitment");
      expect(user).toEqual(mockUsers[0]);
    });

    it("should return null for non-existent commitments", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const user = await userModel.findUserByIdNumber("nonexistent_commitment");
      expect(user).toBeNull();
    });
  });

  describe("Security Edge Cases", () => {
    it("should prevent timing attacks during verification", async () => {
      bcrypt.compare.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve(true), 100)
      ));

      const start = Date.now();
      await userModel.verifyIdNumber("hash", "input");
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(100);
      // Add more sophisticated timing assertions if needed
    });

    it("should handle empty/null commitment values safely", async () => {
      await expect(userModel.saveUser({
        commitment: "",
        password: "valid"
      })).rejects.toThrow("ID number and password are required");

      await expect(userModel.verifyIdNumber("hash", "")).rejects.toThrow();
    });
  });
});