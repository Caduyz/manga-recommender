import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
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
  @IsNumber()
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
