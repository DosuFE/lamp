import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './roles/roles.guard';
import { FaceVerificationService } from './face-verification.service';
import { FaceVerifiedGuard } from './guards/face-verified.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: 'secretkey',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    FaceVerificationService,
    FaceVerifiedGuard,
  ],
  exports: [FaceVerifiedGuard, UsersModule, FaceVerificationService],
})
export class AuthModule {}
