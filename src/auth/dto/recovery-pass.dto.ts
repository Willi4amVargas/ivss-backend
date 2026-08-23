import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RecoveryPasswordDto {
  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'USER01',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Numero de recuperacion',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  recovery_code: string;

  @ApiProperty({
    description: 'Nueva Contraseña del usuario',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  new_password: string;
}
