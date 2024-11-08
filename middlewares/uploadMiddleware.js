import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinaryConfig.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'other';
    if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'videos';
    } else if (file.mimetype === 'application/pdf' || file.mimetype.includes('wordprocessingml')) {
      folder = 'documents';
    }

    return {
      folder,
      resource_type: folder === 'videos' ? 'video' : 'auto',
      allowed_formats: folder === 'documents' ? ['pdf', 'doc', 'docx'] : undefined,
    };
  },
});

const upload = multer({ storage });

export default upload;
