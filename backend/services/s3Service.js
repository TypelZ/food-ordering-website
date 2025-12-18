/**
 * S3 Service
 * Handles image uploads to AWS S3 or local storage
 * Uses IAM role credentials (no access keys in code)
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Initialize S3 client (uses IAM role credentials automatically on EC2)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET || 'food-images-bucket';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Upload image to S3
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - S3 URL of uploaded image
 */
const uploadImageToS3 = async (fileBuffer, originalName, mimeType) => {
  // Generate unique filename
  const ext = path.extname(originalName);
  const key = `menu-images/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read'
  });

  try {
    await s3Client.send(command);
    
    // Return the public URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload image to S3');
  }
};

/**
 * Delete image from S3
 * @param {string} imageUrl - Full S3 URL of image
 */
const deleteImageFromS3 = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    // Extract key from URL
    const url = new URL(imageUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    // Don't throw - deletion failure shouldn't break the flow
  }
};

/**
 * Upload image to local storage (for development)
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - Local URL of uploaded image
 */
const uploadImageLocal = async (fileBuffer, originalName, mimeType) => {
  const ext = path.extname(originalName);
  const filename = `${uuidv4()}${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);

  try {
    fs.writeFileSync(filepath, fileBuffer);
    // Return local URL that will be served by Express static
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Local upload error:', error);
    throw new Error('Failed to upload image locally');
  }
};

/**
 * Delete image from local storage
 * @param {string} imageUrl - Local URL of image
 */
const deleteImageLocal = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;

  try {
    const filename = path.basename(imageUrl);
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error('Local delete error:', error);
  }
};

// Use S3 in production, local storage in development
const isProduction = process.env.NODE_ENV === 'production' && process.env.S3_BUCKET;

module.exports = {
  uploadImage: isProduction ? uploadImageToS3 : uploadImageLocal,
  deleteImage: isProduction ? deleteImageFromS3 : deleteImageLocal,
  // Export for testing
  _uploadImageToS3: uploadImageToS3,
  _uploadImageLocal: uploadImageLocal
};
