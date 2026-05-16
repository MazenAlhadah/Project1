const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadFile = async (filePath, options = {}) => {
  return cloudinary.uploader.upload(filePath, { resource_type: 'auto', ...options });
};

const deleteFile = async (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * توليد Signed URL مؤقت لملف PDF محمي (15 دقيقة)
 */
const generateSignedUrl = (publicId) => {
  const expiresAt = Math.round(Date.now() / 1000) + 15 * 60;
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    expires_at: expiresAt,
  });
};

module.exports = { cloudinary, uploadFile, deleteFile, generateSignedUrl };
