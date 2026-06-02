import { IsEnum } from 'class-validator';

export enum TenantStatusAction {
  ACTIVATE = 'ACTIVE',
  SUSPEND = 'SUSPENDED',
  CANCEL = 'CANCELED',
}

export class UpdateTenantStatusDto {
  @IsEnum(TenantStatusAction)
  status: TenantStatusAction;
}
