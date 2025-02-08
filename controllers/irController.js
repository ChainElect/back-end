const {
  initializeModels,
  detectAndExtractFace,
} = require("../services/irService");

// Capture Face from Selfie
exports.captureFaceFromSelfie = async (req, res) => {
  const { path: selfiePath } = req.file;

  if (!selfiePath) {
    return res.status(400).json({
      success: false,
      message: "Selfie image is required.",
    });
  }

  try {
    await initializeModels();
    const croppedFacePath = await detectAndExtractFace(selfiePath);
    res.json({ success: true, selfieFacePath: croppedFacePath });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Capture Face from ID Card
exports.captureFaceFromIDCard = async (req, res) => {
  const { path: idCardPath } = req.file;

  if (!idCardPath) {
    return res.status(400).json({
      success: false,
      message: "ID card image is required.",
    });
  }

  try {
    await initializeModels();
    const croppedFacePath = await detectAndExtractFace(idCardPath);
    res.json({ success: true, idCardFacePath: croppedFacePath });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
