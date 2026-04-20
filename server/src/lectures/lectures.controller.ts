import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { LecturesService } from './lectures.service';

type UploadedPdfFile = {
  filename: string;
  originalname: string;
};

@Controller('lectures')
export class LecturesController {
  constructor(private readonly lectureService: LecturesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  create(@Body() dto: CreateLectureDto, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can create lecture');
    }

    return this.lectureService.create({
      courseId: dto.courseId,
      title: dto.title,
      content: dto.content,
      videoUrl: dto.videoUrl,
      pdfUrl: dto.pdfUrl,
      pdfFileName: dto.pdfFileName,
      date: new Date(dto.date),
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('pdf-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const name = file.originalname?.toLowerCase() ?? '';
        const ok = file.mimetype === 'application/pdf' || name.endsWith('.pdf');
        if (!ok) {
          return cb(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'pdfs');
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const name = `${Date.now()}-${randomBytes(8).toString('hex')}.pdf`;
          cb(null, name);
        },
      }),
    }),
  )
  uploadPdf(@UploadedFile() file: UploadedPdfFile, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can upload PDFs');
    }
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      pdfUrl: `/files/pdfs/${file.filename}`,
      pdfFileName: file.originalname || 'document.pdf',
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: number, @Request() req) {
    return this.lectureService.findByCourse(+courseId, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can list all lectures');
    }

    return this.lectureService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  updateLecture(@Param('id') id: string, @Body() dto: any, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can update lecture');
    }

    return this.lectureService.updateLecture(+id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  deleteLecture(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can delete lecture');
    }

    return this.lectureService.deleteLecture(+id);
  }
}
