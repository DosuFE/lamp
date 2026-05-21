import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FaceVerifiedGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authUser = request.user as { userId: number; role: string };

    if (!authUser?.userId) return false;
    if (authUser.role === 'admin') return true;

    const user = await this.usersService.findById(authUser.userId);
    if (!user) return false;

    const isVerified =
      Boolean(user.facePrint) && user.faceVerificationRequired === false;

    if (!isVerified) {
      throw new ForbiddenException({
        message: 'VERIFY OR CAPTURE YOUR FACE before accessing this page.',
        code: 'FACE_VERIFICATION_REQUIRED',
      });
    }

    return true;
  }
}
