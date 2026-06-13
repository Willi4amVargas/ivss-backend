import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ─── Prefijo global de API ─────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── ValidationPipe global ────────────────────────────────────────────────
  // CRÍTICO: Garantiza que ningún dato inválido entre al sistema.
  // Sin esto, la integridad estadística está comprometida.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no declarados en los DTOs
      forbidNonWhitelisted: true, // Lanza error si llegan campos extra
      transform: true, // Convierte tipos automáticamente (string → number, etc.)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT ?? 3000;

  // ─── Swagger Documentation ─────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('IVSS API - Medicina Interna')
    .setDescription(
      'API para el Sistema Piloto de Automatización Estadística del Hospital Dr. Patrocinio Peñuela Ruíz',
    )
    .setVersion('1.0')
    .addTag('patients', 'Gestión de pacientes')
    .addTag(
      'clinical-records',
      'Gestión de historias clínicas y hospitalizaciones',
    )
    .addTag('diagnostics', 'Búsqueda de diagnósticos CIE-11')
    .addTag('statistics', 'Reportes epidemiológicos y exportación a Excel')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  console.log(`\n🏥  IVSS — Sistema Piloto de Automatización Estadística`);
  console.log(`   Hospital Dr. Patrocinio Peñuela Ruíz`);
  console.log(`   Departamento de Medicina Interna\n`);
  console.log(`🚀  Servidor corriendo en: http://localhost:${port}/api/v1`);
  console.log(`\n📋  Endpoints disponibles:`);
  console.log(`   Pacientes:         http://localhost:${port}/api/v1/patients`);
  console.log(
    `   Historias Clínicas: http://localhost:${port}/api/v1/clinical-records`,
  );
  console.log(
    `   Diagnósticos ICD:  http://localhost:${port}/api/v1/diagnostics/search?query=x`,
  );
  console.log(
    `   Estadísticas:      http://localhost:${port}/api/v1/statistics/summary`,
  );
  console.log(
    `   Exportar Excel:    http://localhost:${port}/api/v1/statistics/export`,
  );
  console.log(`\n📚  Swagger Docs:      http://localhost:${port}/api/docs\n`);
}

bootstrap();
