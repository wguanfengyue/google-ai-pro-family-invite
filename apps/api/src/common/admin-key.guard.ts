import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

type RequestWithHeaders = {
  header(name: string): string | undefined;
};

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_API_KEY');
    const actual = context
      .switchToHttp()
      .getRequest<RequestWithHeaders>()
      .header('x-admin-key');
    if (!expected || !actual || !this.matches(actual, expected)) {
      throw new UnauthorizedException('管理员凭据无效');
    }
    return true;
  }

  private matches(actual: string, expected: string): boolean {
    const left = Buffer.from(actual);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}
