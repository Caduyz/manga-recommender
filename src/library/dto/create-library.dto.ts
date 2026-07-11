import { ReadingStatus } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateLibraryDto {
  @IsString()
  mangaId!: string;

  @IsEnum(ReadingStatus)
  status!: ReadingStatus;
}
