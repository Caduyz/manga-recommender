import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ReadingStatus } from '@prisma/client';

export class UpdateLibraryDto {
  @IsOptional()
  @IsEnum(ReadingStatus)
  status?: ReadingStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  userScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  chapterProgress?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  finishedAt?: Date | null;
}
