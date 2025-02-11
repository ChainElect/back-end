const fs = require("fs");
const { loadImage } = require("canvas");
const faceapi = require("../../utilities/ir/faceApiSetup");
const loadImageUtility = require("../../utilities/ir/processing/loadImage");
const { ERROR_MESSAGES } = require("../../utilities/messages/errorMessages");

// Mock the canvas.loadImage function
jest.mock("canvas", () => ({
  loadImage: jest.fn(),
  // If other exports are needed, add them here.
}));

describe("loadImageUtility", () => {
  beforeEach(() => {
    jest.spyOn(fs, "existsSync");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should load and create a canvas image when file exists", async () => {
    const dummyImage = {}; // dummy image object returned by loadImage
    const dummyCanvas = { dummy: "canvas" };

    fs.existsSync.mockReturnValue(true);
    loadImage.mockResolvedValue(dummyImage);
    jest.spyOn(faceapi, "createCanvasFromMedia").mockReturnValue(dummyCanvas);

    const result = await loadImageUtility("dummy-path.jpg");
    expect(result).toEqual(dummyCanvas);
    expect(fs.existsSync).toHaveBeenCalledWith("dummy-path.jpg");
    expect(loadImage).toHaveBeenCalledWith("dummy-path.jpg");
    expect(faceapi.createCanvasFromMedia).toHaveBeenCalledWith(dummyImage);
  });

  it("should throw an error when file does not exist", async () => {
    fs.existsSync.mockReturnValue(false);
    const dummyPath = "non-existent.jpg";
    await expect(loadImageUtility(dummyPath)).rejects.toThrow(
      ERROR_MESSAGES.IR.IMAGE_PREPROCESSING_FAILED
    );
  });

  it("should throw an error when loadImage fails", async () => {
    fs.existsSync.mockReturnValue(true);
    loadImage.mockRejectedValue(new Error("Load failed"));

    await expect(loadImageUtility("dummy-path.jpg")).rejects.toThrow(
      ERROR_MESSAGES.IR.IMAGE_PREPROCESSING_FAILED
    );
  });
});
