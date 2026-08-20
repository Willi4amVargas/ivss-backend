import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClinicalRecordsModule } from './clinical-records/clinical-records.module';
import { IcdApiModule } from './icd-api/icd-api.module';
import { PatientsModule } from './patients/patients.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    // ─── Configuración global de variables de entorno ───────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),

    // ─── Conexión a PostgreSQL vía TypeORM ──────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        let redisUrl = configService.get<string>('REDIS_URL');

        if (!redisUrl) {
          const isTls = configService.get<boolean>('REDIS_TLS', false);
          const protocol = isTls ? 'redis' : 'rediss';
          const user = configService.get<string>('REDIS_USERNAME', '');
          const pass = configService.get<string>('REDIS_PASSWORD', '');
          const host = configService.get<string>('REDIS_HOST', 'localhost');
          const port = configService.get<number>('REDIS_PORT', 6379);
          const db = configService.get<number>('REDIS_DB', 0);

          const auth = user || pass ? `${user}:${pass}@` : '';

          redisUrl = `${protocol}://${auth}${host}:${port}/${db}`;
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'root'),
          database: configService.get<string>('DB_NAME', 'ivss'),
          autoLoadEntities: true,
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') === 'development',
          migrations: [__dirname + '/migrations/**/*{.js,.ts}'],
          migrationsRun: true,
          cache: {
            type: 'redis',
            options: {
              url: redisUrl,
            },
          },
        };
      },
    }),

    // ─── Módulos de negocio ─────────────────────────────────────────────
    PatientsModule,
    ClinicalRecordsModule,
    IcdApiModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
