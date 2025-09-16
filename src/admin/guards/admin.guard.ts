import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../common/decorators/roles.decorator";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log("User:", user);
    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}
