import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { supabaseConfig } from '../config/supabase.config';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const config = supabaseConfig(this.configService);
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase URL and key must be provided in environment variables');
    }
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getUser(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error) throw error;
    return user;
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async getPublicKey() {
    try {
      const url = `${this.configService.get('SUPABASE_URL')}/.well-known/jwks.json`;
      console.log('Fetching public key from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch public key: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching public key:', error);
      throw error;
    }
  }
} 