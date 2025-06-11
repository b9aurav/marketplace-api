import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const { password: _, ...result } = user;
    return result;
  }

  async register(registerDto: RegisterDto): Promise<{ id: string }> {
    const user = await this.usersService.create(registerDto);
    return { id: user.id };
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user_id: string; role: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      token: this.jwtService.sign(payload),
      user_id: user.id,
      role: user.role,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return;
    }
    
    // In a real app, generate a token and send email
    // For this example, we'll just log it
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '1h' },
    );
    
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    // Store the token or send an email with a reset link
    // await this.usersService.storeResetToken(user.id, resetToken);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, new_password } = resetPasswordDto;
    
    try {
      // Verify the token
      const payload = this.jwtService.verify(token);
      
      // Find the user
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }
      
      // Update the password
      await this.usersService.updatePassword(user.id, new_password);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}