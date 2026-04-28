import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage } from './cloudinary.storage';

@Controller('upload')
export class UploadController {
  @Post('pdf')
  @UseInterceptors(FileInterceptor('file', { storage }))
  uploadPdf(@UploadedFile() file: any) {
    return {
      url: file.path,
    };
  }
}
