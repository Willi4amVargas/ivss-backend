import { Module } from '@nestjs/common';
import { IcdApiController } from './icd-api.controller';
import { IcdApiService } from './icd-api.service';

@Module({
  controllers: [IcdApiController],
  providers: [IcdApiService],
  exports: [IcdApiService],
})
export class IcdApiModule {}
