const { processAndCompareFaces } = require("../services/irService");

/**
 * Compare a selfie and ID card image.
 */
exports.compareFaces = async (req, res) => {
  const { selfie, idCard } = req.files;

  if (!selfie || !idCard) {
    return res.status(400).json({
      success: false,
      message: "Both selfie and ID card images are required.",
    });
  }

  try {
    const isMatch = await processAndCompareFaces(
      selfie[0].path,
      idCard[0].path
    );

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
