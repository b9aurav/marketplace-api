import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized product recommendations' })
  @ApiResponse({ status: 200, description: 'Returns recommended products' })
  async getRecommendations(@Request() req) {
    return this.recommendationsService.getPersonalizedRecommendations(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('wishlist')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({ status: 200, description: 'Returns user wishlist' })
  async getWishlist(@Request() req) {
    return this.recommendationsService.getWishlist(req.user.id);
  }
}