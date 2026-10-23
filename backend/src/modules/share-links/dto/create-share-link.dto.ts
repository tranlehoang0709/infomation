import { IsBoolean, IsISO8601, IsObject, IsOptional } from 'class-validator';

export class CreateShareLinkDto {
  @IsObject()
  visibility!: {
    profile?: boolean;
    educations?: boolean;
    certificates?: boolean;
    experiences?: boolean;
    skills?: boolean;
    projects?: boolean;
    interests?: boolean;
  };

  @IsOptional() @IsISO8601()
  expiresAt?: string | null;
}
