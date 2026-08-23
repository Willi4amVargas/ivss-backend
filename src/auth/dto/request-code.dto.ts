import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestCodeDto {
  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'USER01',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
