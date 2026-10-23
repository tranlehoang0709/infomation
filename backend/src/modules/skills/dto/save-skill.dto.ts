import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SaveSkillDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  proficiency?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
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
