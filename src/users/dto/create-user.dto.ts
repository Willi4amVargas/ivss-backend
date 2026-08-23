import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateUserDto {
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
  description: string;

  @ApiProperty({
    description: 'Perfil del usuario (esto se cambiara en el futuro)',
    example: '1234',
  })
  @IsUUID()
  @IsNotEmpty()
  profile_id: string;

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
    description: 'Estatus del usuario',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiProperty({
    description: 'Codigo de recuperacion del usuario (hasheado)',
  })
  @IsString()
  @IsOptional()
  recovery_code?: string | null;

  @ApiProperty({
    description: 'Fecha de expiracion del codigo de recuperacion del usuario',
  })
  @IsDate()
  @IsOptional()
  recovery_code_expires_at?: Date | null;
}
