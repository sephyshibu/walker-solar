import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for product images
const productImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'walkers/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto' }
      ],
      public_id: `product_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

// Storage configuration for product videos
const productVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'walkers/videos',
      resource_type: 'video',
      allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
      public_id: `video_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

// Storage configuration for gallery images
const galleryImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'walkers/gallery',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
      ],
      public_id: `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

// Storage configuration for user profile images
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'walkers/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }
      ],
      public_id: `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

// Storage configuration for order invoices (PDF/images)
const invoiceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === 'application/pdf';
    return {
      folder: 'walkers/invoices',
      resource_type: isPdf ? 'raw' : 'image',
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      public_id: `invoice_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

// File filter for images
const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// File filter for videos
const videoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WebM, MOV, and AVI videos are allowed.'));
  }
};

// File filter for both images and videos
const mediaFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  
  if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV, AVI) are allowed.'));
  }
};

// File filter for invoices (PDF and images)
const invoiceFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed for invoices.'));
  }
};

// Multer upload configurations
export const uploadProductImages = multer({
  storage: productImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for images
  },
});

export const uploadProductVideo = multer({
  storage: productVideoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max for videos
  },
});

export const uploadGalleryImage = multer({
  storage: galleryImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

export const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export const uploadInvoice = multer({
  storage: invoiceStorage,
  fileFilter: invoiceFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for invoices
  },
});

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// Helper function to extract public ID from Cloudinary URL
export const extractPublicId = (url: string): string | null => {
  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

// Helper function to get optimized URL
export const getOptimizedUrl = (publicId: string, options: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
} = {}): string => {
  const { width, height, crop = 'limit', quality = 'auto', format = 'auto' } = options;
  
  const transformations: any = [
    { quality, fetch_format: format }
  ];
  
  if (width || height) {
    transformations.unshift({ width, height, crop });
  }
  
  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
  });
};

// Helper function to upload from URL
export const uploadFromUrl = async (url: string, folder: string): Promise<string | null> => {
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: `walkers/${folder}`,
      quality: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading from URL:', error);
    return null;
  }
};

export { cloudinary };
