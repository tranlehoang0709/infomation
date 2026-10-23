import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveCertificateDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuer?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  credentialCode?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  issueDate?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  expiryDate?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  credentialUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
