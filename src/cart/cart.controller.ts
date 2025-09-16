import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { CartService } from "./cart.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { ApplyCouponDto } from "./dto/apply-coupon.dto";

@ApiTags("Cart")
@Controller("cart")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: "Get user cart" })
  @ApiResponse({ status: 200, description: "Returns the user cart" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post("items")
  @ApiOperation({ summary: "Add item to cart" })
  @ApiResponse({ status: 201, description: "Item added to cart" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async addItem(@Request() req, @Body() addCartItemDto: AddCartItemDto) {
    return this.cartService.addItem(req.user.id, addCartItemDto);
  }

  @Delete("items/:itemId")
  @ApiOperation({ summary: "Remove item from cart" })
  @ApiResponse({ status: 204, description: "Item removed from cart" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Item not found" })
  @HttpCode(204)
  async removeItem(@Request() req, @Param("itemId") itemId: string) {
    await this.cartService.removeItem(req.user.id, itemId);
    return null;
  }

  @Post("apply-coupon")
  @ApiOperation({ summary: "Apply discount coupon" })
  @ApiResponse({ status: 200, description: "Coupon applied" })
  @ApiResponse({ status: 400, description: "Bad request or invalid coupon" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async applyCoupon(@Request() req, @Body() applyCouponDto: ApplyCouponDto) {
    return this.cartService.applyCoupon(req.user.id, applyCouponDto.code);
  }
}
