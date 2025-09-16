import { SetMetadata } from '@nestjs/common';

export const ADMIN_AUDIT_KEY = 'admin_audit';

export interface AdminAuditOptions {
  action: string;
  resource: string;
  description?: string;
}

export const AdminAudit = (options: AdminAuditOptions) => 
  SetMetadata(ADMIN_AUDIT_KEY, options);