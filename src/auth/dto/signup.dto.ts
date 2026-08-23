import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ToUpperCaseString } from '../../utils/transforms/to-uppercase.transform';

export class SignUpDto {
  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'USER01',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Descripción de usuario',
    example: 'Juan Carlos',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(ToUpperCaseString)
  description: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: '1234',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Perfil del usuario (esto se cambiara en el futuro)',
    example: '1234',
  })
  @IsUUID()
  @IsNotEmpty()
  profile_id: string;
}
