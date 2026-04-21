import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Header,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { LecturesService } from './lectures.service';

type UploadedPdfFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
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
      date: new Date(dto.date),
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/pdf')
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
      storage: memoryStorage(),
    }),
  )
  uploadPdf(
    @Param('id') id: string,
    @UploadedFile() file: UploadedPdfFile,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can upload PDFs');
    }
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.lectureService.setLecturePdf(+id, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/pdf')
  clearPdf(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can clear PDFs');
    }
    return this.lectureService.clearLecturePdf(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/pdf')
  @Header('Cache-Control', 'private, max-age=0, must-revalidate')
  async downloadPdf(
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const pdf = await this.lectureService.getLecturePdfForUser(
      +id,
      req.user.userId,
    );

    const safeBase =
      (pdf.title || 'lecture')
        .replace(/[^\w\- ]+/g, '')
        .trim()
        .replace(/\s+/g, '-') || 'lecture';
    const filename = `${safeBase}.pdf`;

    res.setHeader('Content-Type', pdf.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdf.data);
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
