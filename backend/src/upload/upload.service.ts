import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'pxwhbjxu',
      api_key: process.env.CLOUDINARY_API_KEY || '261165378736415',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'Z7AVSHRqxttlTXiG8jwpskSfV2U',
      secure: true,
    });
  }

  /**
   * Uploads a single image (data URL or base64 or remote URL) to Cloudinary
   */
  async uploadImage(fileData: string, folder = 'elmahaba/invoices') {
    try {
      if (!fileData) {
        throw new BadRequestException('لم يتم إرسال بيانات الصورة');
      }

      const result = await cloudinary.uploader.upload(fileData, {
        folder,
        resource_type: 'auto',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `فشل رفع الصورة إلى Cloudinary: ${err.message || 'خطأ غير معروف'}`
      );
    }
  }

  /**
   * Uploads multiple images in parallel to Cloudinary
   */
  async uploadMultiple(images: string[], folder = 'elmahaba/invoices') {
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new BadRequestException('قائمة الصور فارغة');
    }

    const results = await Promise.all(
      images.map((img) => this.uploadImage(img, folder))
    );

    return results;
  }
}
