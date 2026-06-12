import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClinicalRecordsModule } from './clinical-records/clinical-records.module';
import { IcdApiModule } from './icd-api/icd-api.module';
import { PatientsModule } from './patients/patients.module';
// import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    // ─── Configuración global de variables de entorno ───────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    // ─── Conexión a PostgreSQL vía TypeORM ──────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'root'),
        database: configService.get<string>('DB_NAME', 'ivss_db'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // ─── Módulos de negocio ─────────────────────────────────────────────
    PatientsModule,
    ClinicalRecordsModule,
    IcdApiModule,
    // StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
