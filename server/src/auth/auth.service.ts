import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { FaceCaptureDto } from './dto/face-capture.dto';
import { FaceVerificationService } from './face-verification.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly faceVerificationService: FaceVerificationService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email is already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      ...dto,
      email,
      password: hashedPassword,
    });
    return user;
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.password || typeof user.password !== 'string') {
      throw new UnauthorizedException('Invalid credentials');
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(dto.password, user.password);
    } catch {
      // Handles malformed legacy password hashes without leaking internals.
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async captureFace(userId: number, dto: FaceCaptureDto) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid user');

    const facePrint = await this.faceVerificationService.computeFacePrint(
      dto.imageBase64,
    );

    await this.usersService.updateUser(userId, {
      faceImageBase64: dto.imageBase64,
      facePrint,
      faceVerificationRequired: false,
      faceVerificationFailedAttempts: 0,
    });

    return { message: 'Face captured successfully', verified: true };
  }

  async verifyFace(userId: number, dto: FaceCaptureDto) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid user');
    if (!user.facePrint) {
      throw new BadRequestException(
        'No enrolled face found. Capture your face first.',
      );
    }

    const isMatch = await this.faceVerificationService.compare(
      dto.imageBase64,
      user.facePrint,
    );

    if (!isMatch) {
      const nextFailedAttempts = (user.faceVerificationFailedAttempts ?? 0) + 1;
      await this.usersService.updateUser(userId, {
        faceVerificationRequired: true,
        faceVerificationFailedAttempts: nextFailedAttempts,
      });
      throw new UnauthorizedException({
        message:
          'Face mismatch detected. You have been locked out until you verify again.',
        code: 'FACE_MISMATCH_LOGOUT',
      });
    }

    await this.usersService.updateUser(userId, {
      faceVerificationRequired: false,
      faceVerificationFailedAttempts: 0,
    });

    return { message: 'Face verified', verified: true };
  }
}
