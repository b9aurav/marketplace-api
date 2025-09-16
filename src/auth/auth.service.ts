import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SupabaseService } from "../supabase/supabase.service";
import { CreateUserDto } from "../users/dto/create-user.dto";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private supabaseService: SupabaseService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      // Register with Supabase
      const { user } = await this.supabaseService.signUp(
        registerDto.email,
        registerDto.password,
      );

      if (!user) {
        throw new UnauthorizedException("Registration failed");
      }

      // Create user in our database
      const createUserDto: CreateUserDto = {
        id: user.id,
        email: registerDto.email,
        name: registerDto.name,
        phone: registerDto.phone,
      };

      const dbUser = await this.usersService.create(createUserDto);

      return {
        message: "Registration successful",
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
        },
      };
    } catch (error) {
      if (error.message?.includes("already registered")) {
        throw new ConflictException("Email already registered");
      }
      throw new UnauthorizedException(error.message || "Registration failed");
    }
  }

  async login(loginDto: LoginDto) {
    try {
      // Login with Supabase
      const { user, session } = await this.supabaseService.signIn(
        loginDto.email,
        loginDto.password,
      );

      if (!user || !session) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Get user from our database
      const dbUser = await this.usersService.findOne(user.id);

      if (!dbUser) {
        throw new UnauthorizedException("User not found in database");
      }

      return {
        message: "Login successful",
        token: session.access_token,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error.message?.includes("Invalid login credentials")) {
        throw new UnauthorizedException("Invalid credentials");
      }
      throw new UnauthorizedException(error.message || "Login failed");
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  }

  async forgotPassword(email: string) {
    try {
      await this.supabaseService.resetPassword(email);
      return {
        message: "Password reset email sent",
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { new_password } = resetPasswordDto;

    try {
      await this.supabaseService.updatePassword(new_password);
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
