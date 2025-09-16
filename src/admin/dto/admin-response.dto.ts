import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminSuccessResponseDto<T> {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: '2023-12-01T10:00:00.000Z' })
  timestamp: string;
}

export class AdminPaginationDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrev: boolean;
}

export class AdminPaginatedResponseDto<T> {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Data retrieved successfully' })
  message: string;

  @ApiProperty()
  data: T[];

  @ApiProperty()
  pagination: AdminPaginationDto;

  @ApiProperty({ example: '2023-12-01T10:00:00.000Z' })
  timestamp: string;
}

export class AdminErrorResponseDto {
  @ApiProperty()
  error: {
    code: string;
    message: string;
    details: any[];
  };

  @ApiProperty({ example: '2023-12-01T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/admin/users' })
  path: string;
}