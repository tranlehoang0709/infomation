import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveEducationDto {
  @IsString()
  @MaxLength(255)
  schoolName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  degree?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  major?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  startDate?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

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
