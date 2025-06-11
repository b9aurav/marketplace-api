import { ConfigService } from '@nestjs/config';

export const supabaseConfig = (configService: ConfigService) => ({
  supabaseUrl: configService.get<string>('SUPABASE_URL'),
  supabaseKey: configService.get<string>('SUPABASE_ANON_KEY'),
}); 