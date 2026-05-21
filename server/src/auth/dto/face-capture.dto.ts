import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class FaceCaptureDto {
  @IsString()
  @Matches(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/, {
    message:
      'imageBase64 must be a JPEG/PNG data URL (data:image/...;base64,...) captured from the app camera.',
  })
  @MaxLength(10_000_000)
  imageBase64!: string;
}

export class FaceFramesDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @Matches(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/, {
    each: true,
    message:
      'each frame must be a JPEG/PNG data URL (data:image/...;base64,...) captured from the app camera.',
  })
  @MaxLength(10_000_000, { each: true })
  frames!: string[];
}
