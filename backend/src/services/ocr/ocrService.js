const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;

const processDocument = async (filePath) => {
  try {
    console.log('[OCR] Starting OCR processing for:', filePath);
    
    // 1. Preprocess image with Sharp for better OCR accuracy
    const processedPath = `${filePath}-processed.png`;
    console.log('[OCR] Preprocessing image with grayscale, normalize, and sharpen...');
    await sharp(filePath)
      .grayscale()
      .normalize()
      .sharpen()
      .toFile(processedPath);
    console.log('[OCR] Image preprocessing completed');

    // 2. Run Tesseract OCR on the enhanced image
    console.log('[OCR] Running Tesseract OCR recognition...');
    const { data: { text } } = await Tesseract.recognize(processedPath, 'eng');
    console.log('[OCR] Text extracted from image:');
    console.log('[OCR] ===== START OF EXTRACTED TEXT =====');
    console.log(text);
    console.log('[OCR] ===== END OF EXTRACTED TEXT =====');
    console.log('[OCR] Extracted text length:', text.length, 'characters');

    // 3. Cleanup the temporary processed image
    await fs.unlink(processedPath);
    console.log('[OCR] Temporary processed image cleaned up');
    
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from document');
  }
};

module.exports = { processDocument };