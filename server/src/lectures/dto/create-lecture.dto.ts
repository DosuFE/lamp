import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLectureDto {
  @Type(() => Number)
  @IsInt()
  courseId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500000)
  content?: string;

  @IsOptional()
  @IsString()
  @IsUrl(
    { require_protocol: true },
    { message: 'Video URL must be a valid URL with protocol' },
  )
  @MaxLength(2000)
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl(
    { require_protocol: true },
    { message: 'PDF URL must be a valid URL with protocol' },
  )
  @MaxLength(5000)
  pdfUrl?: string;

  @IsDateString()
  date: string;
}
