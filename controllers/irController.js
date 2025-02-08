const {
  initializeModels,
  detectAndExtractFace,
  extractDescriptorFromSelfie,
  extractDescriptorFromIDCard,
  compareDescriptors,
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

exports.compareFaces = async (req, res) => {
  const { selfiePath, idCardPath } = req.body;

  if (!selfiePath || !idCardPath) {
    return res.status(400).json({
      success: false,
      message: "Both selfie and ID card image paths are required.",
    });
  }
  try {
    await initializeModels();

    // Extract descriptors for both images
    const selfieDescriptor = await extractDescriptorFromSelfie(selfiePath);
    const idCardDescriptor = await extractDescriptorFromIDCard(idCardPath);

    // Compare descriptors
    const isMatch = compareDescriptors(selfieDescriptor, idCardDescriptor);

    if (isMatch) {
      return res.json({
        success: true,
        message: "Faces match! Verification successful.",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Faces do not match! Verification failed.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
