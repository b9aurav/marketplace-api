// Cache TTL values in seconds
export const CACHE_TTL = {
  DASHBOARD_METRICS: 5 * 60, // 5 minutes
  SALES_ANALYTICS: 10 * 60, // 10 minutes
  USER_LIST: 10 * 60, // 10 minutes
  USER_DETAILS: 15 * 60, // 15 minutes
  PRODUCT_LIST: 15 * 60, // 15 minutes
  PRODUCT_DETAILS: 30 * 60, // 30 minutes
  CATEGORY_TREE: 30 * 60, // 30 minutes
  ORDER_LIST: 5 * 60, // 5 minutes
  ORDER_ANALYTICS: 10 * 60, // 10 minutes
  SYSTEM_SETTINGS: 60 * 60, // 1 hour
  NOTIFICATIONS: 5 * 60, // 5 minutes
  TRANSACTIONS: 10 * 60, // 10 minutes
  REPORTS: 15 * 60, // 15 minutes
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  DASHBOARD_METRICS: 'admin:dashboard:metrics',
  SALES_ANALYTICS: 'admin:sales:analytics',
  USER_LIST: 'admin:users:list',
  USER_DETAILS: 'admin:users:details',
  USER_ANALYTICS: 'admin:users:analytics',
  PRODUCT_LIST: 'admin:products:list',
  PRODUCT_DETAILS: 'admin:products:details',
  PRODUCT_ANALYTICS: 'admin:products:analytics',
  CATEGORY_LIST: 'admin:categories:list',
  CATEGORY_TREE: 'admin:categories:tree',
  CATEGORY_ANALYTICS: 'admin:categories:analytics',
  ORDER_LIST: 'admin:orders:list',
  ORDER_DETAILS: 'admin:orders:details',
  ORDER_ANALYTICS: 'admin:orders:analytics',
  TRANSACTION_LIST: 'admin:transactions:list',
  TRANSACTION_DETAILS: 'admin:transactions:details',
  PAYMENT_ANALYTICS: 'admin:payments:analytics',
  SYSTEM_SETTINGS: 'admin:settings',
  COUPON_LIST: 'admin:coupons:list',
  COUPON_DETAILS: 'admin:coupons:details',
  NOTIFICATIONS: 'admin:notifications',
  REPORTS: 'admin:reports',
  FILE_UPLOADS: 'admin:files',
} as const;

// Cache invalidation patterns
export const CACHE_PATTERNS = {
  ALL_ADMIN: 'admin:*',
  DASHBOARD: 'admin:dashboard:*',
  USERS: 'admin:users:*',
  PRODUCTS: 'admin:products:*',
  CATEGORIES: 'admin:categories:*',
  ORDERS: 'admin:orders:*',
  TRANSACTIONS: 'admin:transactions:*',
  PAYMENTS: 'admin:payments:*',
  SETTINGS: 'admin:settings:*',
  COUPONS: 'admin:coupons:*',
  NOTIFICATIONS: 'admin:notifications:*',
  REPORTS: 'admin:reports:*',
  FILES: 'admin:files:*',
} as const;