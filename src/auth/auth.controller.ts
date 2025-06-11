import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards, 
  Request, 
  Get 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() registerDto: RegisterDto) {
    // Register with Supabase
    const { user } = await this.supabaseService.signUp(
      registerDto.email,
      registerDto.password,
    );

    // Create user in our database
    await this.usersService.create({
      ...registerDto,
      id: user.id, // Use Supabase user ID
    });

    return { message: 'Registration successful' };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto) {
    const { session } = await this.supabaseService.signIn(
      loginDto.email,
      loginDto.password,
    );

    return {
      access_token: session.access_token,
      user: session.user,
    };
  }

  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    await this.supabaseService.signOut();
    return { message: 'Logout successful' };
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Returns current user' })
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async resetPassword(@Body('email') email: string) {
    await this.supabaseService.resetPassword(email);
    return { message: 'Password reset email sent' };
  }

  @Post('update-password')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async updatePassword(
    @Request() req,
    @Body('newPassword') newPassword: string,
  ) {
    await this.supabaseService.updatePassword(newPassword);
    await this.usersService.updatePassword(req.user.id, newPassword);
    return { message: 'Password updated successfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate password reset' })
  @ApiResponse({ status: 200, description: 'Reset token sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'If your email is registered, you will receive a password reset link' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async resetPasswordDto(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password has been reset successfully' };
  }
}