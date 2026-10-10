import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a single image to Cloudinary' })
  async uploadSingle(@Body() body: { image: string; folder?: string }) {
    return this.uploadService.uploadImage(body.image, body.folder);
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple images to Cloudinary' })
  async uploadMultiple(@Body() body: { images: string[]; folder?: string }) {
    return this.uploadService.uploadMultiple(body.images, body.folder);
  }
}
