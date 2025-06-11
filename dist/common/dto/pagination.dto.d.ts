export declare class PaginationDto {
    page?: number;
    limit?: number;
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
    };
}
