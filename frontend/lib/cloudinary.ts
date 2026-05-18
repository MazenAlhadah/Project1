import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const generateSignedUrl = (publicId: string, expiresIn = 900) => {
  const timestamp = Math.round(new Date().getTime() / 1000) + expiresIn;
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    expires_at: timestamp,
  });
};

export const deleteFile = async (publicId: string, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

export { cloudinary };
