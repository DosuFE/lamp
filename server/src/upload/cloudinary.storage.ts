import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'src/config/cloudinary';

export const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lamp_pdfs',
    resource_type: 'raw',
  } as any,
});
