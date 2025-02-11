const pool = require("../../config/db");
const userModel = require("../../models/userModel");

jest.mock("../../config/db"); // Mock the db module

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
