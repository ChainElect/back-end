const fs = require("fs");
const { createCanvas } = require("canvas"); // Import canvas library
const { PassThrough } = require("stream");
const cropFace = require("../../utilities/ir/processing/cropFace");

describe("cropFace", () => {
  let dummyCanvas, faceRegion, outputPath;

  beforeEach(() => {
    // 🔹 Create a valid dummy canvas to avoid "Image or Canvas expected" errors
    dummyCanvas = createCanvas(200, 200);

    faceRegion = { x: 10, y: 20, width: 100, height: 100 };
    outputPath = "dummy-output.jpg";

    // Mock fs.createWriteStream
    jest.spyOn(fs, "createWriteStream").mockImplementation(() => {
      const fakeStream = new PassThrough();

      // Prevent unhandled errors
      fakeStream.on("error", () => {});

      // Emit error *after* Jest attaches listeners
      process.nextTick(() => {
        fakeStream.emit("error", new Error("Write failed"));
      });

      return fakeStream;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should resolve when cropping and saving image succeeds", async () => {
    jest
      .spyOn(fs, "createWriteStream")
      .mockImplementation(() => new PassThrough());

    await expect(
      cropFace(dummyCanvas, faceRegion, outputPath)
    ).resolves.toBeUndefined();
  });

  it("should throw an error when writing fails", async () => {
    await expect(cropFace(dummyCanvas, faceRegion, outputPath)).rejects.toThrow(
      "Face cropping failed. Unable to process the image." // Adjusted expected error message
    );
  });
});
