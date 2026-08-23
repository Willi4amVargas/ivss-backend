import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signin.dto';
import { ApiOperation } from '@nestjs/swagger';
import { SignUpDto } from './dto/signup.dto';
import { Public } from './auth.reflector';
import { RequestCodeDto } from './dto/request-code.dto';
import { RecoveryPasswordDto } from './dto/recovery-pass.dto';
import { ActiveUser } from '../users/users.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Devuelve la informacion del token pasado',
  })
  @Get('me')
  getUserData(@ActiveUser() user: User) {
    console.log("EJECUTADO EL ME")
    return user;
  }

  @ApiOperation({
    summary:
      'Usado para obtener el JSON Web Token necesario para usar los endpoints',
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @ApiOperation({
    summary:
      'Crea un usuario en el sistema y le envia un email de confirmacion',
  })
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @ApiOperation({
    summary:
      'Inicia el proceso de recuperacion de contraseña enviando un correo al usuario con el codigo',
  })
  @Public()
  @Post('recovery')
  recoveryCode(@Body() requestCodeDto: RequestCodeDto) {
    return this.authService.getRecoveryCode(requestCodeDto.username);
  }

  @ApiOperation({
    summary:
      'Envia el codigo de recuperacion creado y la nueva contraseña, si es valida lo cambia en la base de datos',
  })
  @Public()
  @Put('recovery')
  recovery(@Body() recoveryPass: RecoveryPasswordDto) {
    return this.authService.updateUserPassword(
      recoveryPass.username,
      recoveryPass,
    );
  }
}
