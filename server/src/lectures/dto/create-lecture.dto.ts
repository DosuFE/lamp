import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
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
  @MaxLength(2000)
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pdfUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pdfFileName?: string;

  @IsDateString()
  date: string;
}
