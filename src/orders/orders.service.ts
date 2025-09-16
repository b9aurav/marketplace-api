import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Order, OrderStatus } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Product } from "../products/entities/product.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async getUserOrders(userId: string) {
    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ["items", "items.product"],
      order: { created_at: "DESC" },
    });

    return {
      orders,
      total,
    };
  }

  async getOrderDetails(userId: string, orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ["items", "items.product"],
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return { order };
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, user: { id: userId } },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error("Only pending orders can be cancelled");
    }

    order.status = OrderStatus.CANCELLED;
    await this.ordersRepository.save(order);

    return { message: "Order cancelled successfully" };
  }

  async trackOrder(userId: string, orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, user: { id: userId } },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return { order };
  }

  async getAllOrders(userId?: string, status?: string) {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.user", "user")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .leftJoinAndSelect("order.address", "address");

    if (userId) {
      queryBuilder.where("order.user_id = :userId", { userId });
    }

    if (status) {
      queryBuilder.andWhere("order.status = :status", { status });
    }

    const orders = await queryBuilder
      .orderBy("order.created_at", "DESC")
      .getMany();

    return {
      orders: orders.map((order) => ({
        id: order.id,
        date: order.created_at,
        total: order.total,
        status: order.status,
        user: {
          id: order.user.id,
          email: order.user.email,
          name: order.user.name,
        },
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product?.id,
            name: item.product?.name,
            images: item.product?.images,
          },
        })),
        address: order.address,
        tracking_number: order.tracking_number,
        payment_method: order.payment_method,
        transaction_id: order.transaction_id,
      })),
    };
  }

  async updateOrderStatus(
    orderId: string,
    updateOrderStatusDto: { status: OrderStatus },
  ) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    order.status = updateOrderStatusDto.status;
    await this.ordersRepository.save(order);

    return {
      message: "Order status updated successfully",
      order: {
        id: order.id,
        status: order.status,
      },
    };
  }

  async createOrder(userId: string, createOrderDto: any) {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    // eslint-disable-next-line no-console
    console.log("About to start transaction");
    await queryRunner.startTransaction();
    // eslint-disable-next-line no-console
    console.log("Transaction started:", queryRunner.isTransactionActive);

    try {
      const order = this.ordersRepository.create({
        user: { id: userId },
        user_id: userId,
        status: OrderStatus.PENDING,
        total: 0,
        address_id: createOrderDto.address_id,
        payment_method: createOrderDto.payment_method,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);
      // eslint-disable-next-line no-console
      console.log("Saved order ID:", savedOrder.id);

      let total = 0;
      const orderItems = [];
      for (const item of createOrderDto.items) {
        // Fetch product from DB to get price
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.product_id },
        });
        if (!product) {
          throw new NotFoundException("Product not found");
        }
        // eslint-disable-next-line no-console
        console.log("Product fetched for order item:", product);
        const price = product.price;
        total += price * item.quantity;
        orderItems.push(
          this.orderItemsRepository.create({
            order: savedOrder,
            order_id: savedOrder.id,
            product_id: item.product_id,
            product,
            quantity: item.quantity,
            price,
            product_name: product.name,
          }),
        );
      }

      await queryRunner.manager.save(OrderItem, orderItems);
      savedOrder.total = total;
      await queryRunner.manager.save(Order, savedOrder);

      // Reload the order with all relations using query builder from DataSource
      // eslint-disable-next-line no-console
      console.log(
        "Reloading order with ID:",
        savedOrder.id,
        "and user ID:",
        userId,
      );
      const fullOrder = await this.dataSource
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.items", "items")
        .leftJoinAndSelect("items.product", "product")
        .where("order.id = :id", { id: savedOrder.id })
        .andWhere("order.user_id = :userId", { userId })
        .getOne();
      // eslint-disable-next-line no-console
      console.log("Reloaded order:", fullOrder);
      if (!fullOrder) throw new NotFoundException("Order not found");

      return { order: fullOrder };
    } catch (error) {
      // Rollback the transaction on error, only if active
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
}
