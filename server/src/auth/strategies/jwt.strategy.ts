import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secretkey',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    const tokenVersion = Number(payload?.tokenVersion ?? 0);
    const currentTokenVersion = Number(user.tokenVersion ?? 0);
    if (tokenVersion !== currentTokenVersion) {
      throw new UnauthorizedException({
        message: 'Session expired. Please login again.',
        code: 'TOKEN_REVOKED',
      });
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      faceVerificationRequired: user.faceVerificationRequired ?? true,
      hasFaceProfile: Boolean(user.facePrint),
    };
  }
}
