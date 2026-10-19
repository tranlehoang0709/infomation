import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(150)
  fullName!: string;

  @IsOptional() @IsString() @MaxLength(200)
  headline?: string | null;

  @IsOptional() @IsString() @MaxLength(30)
  phone?: string | null;

  @IsOptional() @IsEmail() @MaxLength(255)
  contactEmail?: string | null;

  @IsOptional() @IsString() @MaxLength(255)
  location?: string | null;

  @IsOptional() @IsString() @MaxLength(10000)
  bio?: string | null;

  @IsOptional() @Matches(/^\d{1,20}$/)
  avatarMediaId?: string | null;

  @IsOptional() @Matches(/^\d{1,20}$/)
  cvMediaId?: string | null;

  @IsOptional() @Matches(/^\d{1,20}$/)
  coverMediaId?: string | null;
}
