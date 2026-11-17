import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';

/**
 * Carga las variables de entorno igual que lo haría el arranque real. La app
 * (ConfigModule) lee `.env`; si no existe, cae a `.env.development` para que
 * `pnpm swagger:export` funcione en local sin configurar nada.
 */
function loadEnv() {
  for (const file of ['.env', '.env.development']) {
    const envPath = resolve(__dirname, '..', file);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
    break;
  }
}

/**
 * Genera el documento OpenAPI (swagger.json) a partir de los controladores y
 * DTOs de la aplicación, sin levantar el servidor HTTP.
 *
 * Uso: `pnpm swagger:export`
 *
 * Requiere que las dependencias de infraestructura (PostgreSQL y Redis) estén
 * disponibles, ya que TypeORM inicializa la conexión al crear el módulo.
 */
async function bootstrap() {
  loadEnv();

  const app = await NestFactory.create(AppModule);

  // Debe coincidir con src/main.ts para que las rutas incluyan el prefijo real.
  app.setGlobalPrefix('api/v1');

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

  const out = resolve(__dirname, '../swagger.json');
  writeFileSync(out, JSON.stringify(document, null, 2));
  console.log(`Swagger JSON generado en ${out}`);

  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
