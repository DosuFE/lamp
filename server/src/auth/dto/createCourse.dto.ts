import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  @MinLength(2)
  @MaxLength(120)
  department: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
