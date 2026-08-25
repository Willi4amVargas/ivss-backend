import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StatisticsService {
  constructor() {}
  findAll() {
    return `This action returns all statistics`;
  }
}
