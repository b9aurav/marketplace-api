import { PaginationDto } from '../../common/dto/pagination.dto';
declare enum SortOption {
    PRICE_ASC = "price_asc",
    PRICE_DESC = "price_desc",
    NEWEST = "newest",
    RATING = "rating"
}
export declare class FindProductsDto extends PaginationDto {
    category?: string;
    min_price?: number;
    max_price?: number;
    sort?: SortOption;
}
export {};
