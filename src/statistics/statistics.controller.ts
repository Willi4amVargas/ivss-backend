import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { DateRangeDto } from './dto/date-range.dto';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('global-metrics')
  @ApiOperation({
    summary: 'Get global metrics for the Internal Medicine department',
  })
  getGlobalMetrics(@Query() dateRange: DateRangeDto) {
    return this.statisticsService.getGlobalMetrics(
      dateRange.startDate,
      dateRange.endDate,
    );
  }

  @Get('morbidity-by-age')
  @ApiOperation({ summary: 'Get morbidity by age range' })
  getMorbidityByAgeRange(@Query() dateRange: DateRangeDto) {
    return this.statisticsService.getMorbidityByAgeRange(
      dateRange.startDate,
      dateRange.endDate,
    );
  }

  @Get('diagnosis-mortality-frequency')
  @ApiOperation({ summary: 'Get frequency of diagnoses with mortality' })
  getDiagnosisFrequencyWithMortality(@Query() dateRange: DateRangeDto) {
    return this.statisticsService.getDiagnosisFrequencyWithMortality(
      dateRange.startDate,
      dateRange.endDate,
    );
  }

  @Get('average-days-by-diagnosis')
  @ApiOperation({ summary: 'Get average hospitalization days by diagnosis' })
  getAverageHospitalizationDaysByDiagnosis(@Query() dateRange: DateRangeDto) {
    return this.statisticsService.getAverageHospitalizationDaysByDiagnosis(
      dateRange.startDate,
      dateRange.endDate,
    );
  }
}
