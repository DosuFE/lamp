import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  // Allowed email domains for registration.
  private static readonly allowedEmailDomains = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
  ] as const;

  private static readonly allowedEmailDomainRegex = new RegExp(
    `@(${RegisterDto.allowedEmailDomains.map((d) => d.replace('.', '\\.')).join('|')})$`,
    'i',
  );

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2)
  @MaxLength(30, { message: 'Full name must not exceed 30 characters' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Matches(RegisterDto.allowedEmailDomainRegex, {
    message:
      'Email domain not allowed. Use gmail.com, yahoo.com, outlook.com, or hotmail.com',
  })
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least 1 letter and 1 number',
  })
  password: string;

  @Type(() => Number)
  @IsInt({ message: 'Matric number must be a number' })
  @Min(1)
  matricNo: number;

  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  @MinLength(2)
  @MaxLength(120)
  department: string;
}
