import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { SupabaseJwtStrategy } from './strategies/supabase-jwt.strategy';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'supabase-jwt' }),
    SupabaseModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}