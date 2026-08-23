import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import compareHash from '../utils/hash/compareHash';
import { SignUpDto } from './dto/signup.dto';
import { MailService } from '../mail/mail.service';
import textToHash from '../utils/hash/textToHash';
import { JwtService } from '@nestjs/jwt';
import crypto from 'node:crypto';
import { RecoveryPasswordDto } from './dto/recovery-pass.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}
  async signIn(username: string, pass: string) {
    const user = await this.usersService.getOneByUsername(username, {
      id: true,
      username: true,
      description: true,
      password: true,
      email: true,
      profile_id: true,
      status: true,
    });
    if (!user.status) {
      throw new UnauthorizedException();
    }
    if (!(await compareHash(pass, user.password))) {
      throw new UnauthorizedException();
    }
    const { password, status, ...userData } = user;
    const token = this.jwtService.sign(userData, {
      expiresIn: 86400,
    });
    return { access_token: token };
  }

  async signUp(userDto: SignUpDto) {
    // hash password
    const hashedPassword = await textToHash(userDto.password);

    try {
      const createdUser = await this.usersService.create({
        ...userDto,
        password: hashedPassword,
      });

      const html = `<!DOCTYPE html>
  <html lang="es">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Bienvenido/a a Nuestra Plataforma!</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              background-color: #f4f6f9;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              -webkit-font-smoothing: antialiased;
              color: #333333;
          }
          table {
              border-collapse: collapse;
          }
          .button:hover {
              background-color: #3b52d4 !important;
          }
      </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  
      <!-- Wrapper Table -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f9; padding: 40px 10px;">
          <tr>
              <td align="center">
                  
                  <!-- Main Card Container -->
                  <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0" border="0">
                      
                      <!-- Header Bar -->
                      <tr>
                          <td style="background-color: #4F46E5; padding: 32px 40px; text-align: center;">
                              <!-- Icono de Check -->
                              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 56px; height: 56px; line-height: 56px; margin-bottom: 12px;">
                                  <span style="font-size: 28px; color: #ffffff;">✓</span>
                              </div>
                              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">¡Cuenta Creada Exitosamente!</h1>
                          </td>
                      </tr>
  
                      <!-- Body Content -->
                      <tr>
                          <td style="padding: 40px 40px 30px 40px;">
                              <p style="font-size: 16px; line-height: 24px; color: #374151; margin-top: 0; margin-bottom: 20px;">
                                  Hola, <strong style="color: #111827;">${createdUser.description}</strong> 👋
                              </p>
                              <p style="font-size: 15px; line-height: 24px; color: #4B5563; margin-top: 0; margin-bottom: 24px;">
                                  Te damos la bienvenida a nuestra plataforma. Tu cuenta ha sido configurada correctamente y ya estás listo para comenzar a explorar todos nuestros servicios.
                              </p>
  
                              <!-- Account Details Box -->
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 28px;">
                                  <tr>
                                      <td style="padding: 20px;">
                                          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; color: #6B7280; letter-spacing: 0.5px;">Detalles de tu cuenta</p>
                                          <p style="margin: 0 0 4px 0; font-size: 14px; color: #374151;"><strong>Correo electrónico:</strong> ${createdUser.email}</p>
                                          <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Fecha de registro:</strong> ${createdUser.created_at}</p>
                                      </td>
                                  </tr>
                              </table>
  
                              <!-- Primary Call to Action -->
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
                                  <tr>
                                      <td align="center">
                                          <a href="https://ivss.widvu.com" target="_blank" class="button" style="background-color: #4F46E5; color: #ffffff; display: inline-block; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                                              Iniciar Sesión Ahora
                                          </a>
                                      </td>
                                  </tr>
                              </table>
  
                              <p style="font-size: 14px; line-height: 22px; color: #6B7280; margin-top: 0; margin-bottom: 0;">
                                  Si no creaste esta cuenta, puedes ignorar este correo o comunicarte con nuestro equipo de soporte si tienes alguna duda.
                              </p>
                          </td>
                      </tr>
  
                      <!-- Divider -->
                      <tr>
                          <td style="padding: 0 40px;">
                              <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 0;">
                          </td>
                      </tr>
  
                      <!-- Footer -->
                      <tr>
                          <td style="padding: 28px 40px 36px 40px; text-align: center;">
                              <p style="font-size: 13px; line-height: 20px; color: #9CA3AF; margin: 0 0 8px 0;">
                                  © 2026 Widvu S.A. Todos los derechos reservados.
                              </p>
                              <p style="font-size: 12px; line-height: 18px; color: #9CA3AF; margin: 0;">
                                  <a href="https://widvu.com" style="color: #6B7280; text-decoration: underline;">Centro de Ayuda</a> &nbsp;|&nbsp; 
                                  <a href="https://widvu.com" style="color: #6B7280; text-decoration: underline;">Política de Privacidad</a>
                              </p>
                          </td>
                      </tr>
  
                  </table>
  
              </td>
          </tr>
      </table>
  
  </body>
  </html>`;
      await this.mailService.sendMail(
        createdUser.email,
        'USUARIO CREADO EXITOSAMENTE',
        html,
      );
      const {
        password,
        status,
        recovery_code,
        recovery_code_expires_at,
        created_at,
        updated_at,
        ...newUser
      } = createdUser;
      return newUser;
    } catch (error: any) {
      if (error.code === '23503') {
        throw new BadRequestException('Perfil no valido');
      }
      if (error.code === '23505') {
        throw new BadRequestException('Email o nombre de usuario ya registrado');
      }
      throw new BadRequestException();
    }
  }

  private generateRecoveryCode() {
    return crypto.randomInt(100000, 999999);
  }

  async getRecoveryCode(username: string) {
    try {
      const user = await this.usersService.getOneByUsername(username, {
        id: true,
        email: true,
        status: true,
      });
      if (!user.status) {
        throw new BadRequestException('Usuario ivalido');
      }
      const recoveryCode = this.generateRecoveryCode();
      const hashRecoveryCode = await textToHash(recoveryCode.toString());
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await this.usersService.update(user.id, {
        recovery_code: hashRecoveryCode,
        recovery_code_expires_at: expiresAt,
      });

      const html = `<!DOCTYPE html>
    <html lang="es">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 40px 10px;">
        <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
            
            <tr>
                <td style="background-color: #0f172a; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 600; tracking-spacing: 0.5px;">
                    Recuperación de Contraseña
                </h1>
                </td>
            </tr>

            <tr>
                <td style="padding: 40px 30px; text-align: center; color: #334155;">
                <p style="font-size: 16px; margin: 0 0 20px 0; color: #475569; line-height: 1.5;">
                    Hemos recibido una solicitud para restablecer tu contraseña. Utiliza el siguiente código para completar el proceso:
                </p>

                <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7; display: block;">
                    ${recoveryCode}
                    </span>
                </div>

                <p style="font-size: 14px; margin: 0 0 25px 0; color: #64748b;">
                    ⏰ Este código expira en <strong>15 minutos</strong>.
                </p>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">

                <p style="font-size: 12px; margin: 0; color: #94a3b8; line-height: 1.4;">
                    Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura. Tu cuenta seguirá protegida.
                </p>
                </td>
            </tr>

            <tr>
                <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; margin: 0; color: #94a3b8;">
                    &copy; 2026 Widvu S.A. Todos los derechos reservados.
                </p>
                </td>
            </tr>

            </table>
        </td>
        </tr>
    </table>
    </body>
    </html>`;

      await this.mailService.sendMail(
        user.email,
        'RECUPERACIÓN DE CONTRASEÑA',
        html,
      );
      const [localPart, domain] = user.email.split('@');
      const maskedLocal = `${localPart.at(0)}***${localPart.at(-1)}`;
      return {
        message: `Correo de recuperación enviado a ${maskedLocal}@${domain}`,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateUserPassword(username: string, dto: RecoveryPasswordDto) {
    try {
      const user = await this.usersService.getOneByUsername(username, {
        id: true,
        email: true,
        recovery_code: true,
        recovery_code_expires_at: true,
      });

      const {
        id: user_id,
        email,
        recovery_code,
        recovery_code_expires_at,
      } = user;

      if (!recovery_code || !recovery_code_expires_at) {
        throw new BadRequestException();
      }

      const expiresAt = new Date(recovery_code_expires_at).getTime();

      if (Date.now() > expiresAt) {
        await this.usersService.update(user_id, {
          recovery_code: null,
          recovery_code_expires_at: null,
        });
        throw new BadRequestException('Token de recuperacion expirado');
      }

      const isValidHash = await compareHash(dto.recovery_code, recovery_code);

      if (!isValidHash) {
        throw new BadRequestException('Token invalido');
      }

      const hashNewPassword = await textToHash(dto.new_password);
      await this.usersService.update(user_id, {
        password: hashNewPassword,
        recovery_code: null,
        recovery_code_expires_at: null,
      });

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contraseña Actualizada Exitosamente</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Encabezado con color verde de éxito -->
          <tr>
            <td style="background-color: #166534; padding: 30px; text-align: center;">
              <!-- Icono Checkmark en SVG inline -->
              <div style="background-color: #22c55e; width: 48px; height: 48px; border-radius: 50%; display: inline-block; margin-bottom: 12px; vertical-align: middle;">
                <span style="color: #ffffff; font-size: 28px; line-height: 48px; font-weight: bold;">✓</span>
              </div>
              <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 600;">
                ¡Contraseña Actualizada!
              </h1>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; color: #334155;">
              <p style="font-size: 16px; margin: 0 0 15px 0; color: #1e293b; font-weight: 600;">
                Hola, ${username}
              </p>
              <p style="font-size: 15px; margin: 0 0 25px 0; color: #475569; line-height: 1.5;">
                Te confirmamos que la contraseña de tu cuenta ha sido cambiada correctamente. Ya puedes acceder con tus nuevas credenciales.
              </p>

              <!-- Alerta de Seguridad si no realizó el cambio -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 15px; text-align: left; margin: 25px 0;">
                <p style="font-size: 13px; margin: 0; color: #991b1b; line-height: 1.4;">
                  <strong>¿No realizaste este cambio?</strong><br>
                  Si no fuiste tú, tu cuenta podría estar comprometida. Por favor, ponte en contacto con nuestro equipo de soporte de inmediato o restablece tu contraseña nuevamente.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">

              <!-- Información Adicional -->
              <p style="font-size: 12px; margin: 0; color: #94a3b8; line-height: 1.4;">
                Este es un correo automático de seguridad, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; margin: 0; color: #94a3b8;">
                &copy; 2026 Widvu S.A. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await this.mailService.sendMail(
        email,
        'CONFIRMACIÓN: Contraseña actualizada',
        html,
      );

      return {
        message: `Recuperacion de contraseña exitoso`,
      };
    } catch (error) {
      throw error;
    }
  }
}
