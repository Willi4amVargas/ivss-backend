import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClinicalRecordsModule } from './clinical-records/clinical-records.module';
import databaseConfig from './config/database.config';
import { IcdApiModule } from './icd-api/icd-api.module';
import { PatientsModule } from './patients/patients.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    // ─── Configuración global de variables de entorno ───────────────────
    ConfigModule.forRoot({
      isGlobal: true,       // Disponible en todos los módulos sin reimportar
      load: [databaseConfig],
      envFilePath: '.env',
      cache: true,
    }),

    // ─── Conexión a PostgreSQL vía TypeORM ──────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...(configService.get('database') as object),
      }),
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
