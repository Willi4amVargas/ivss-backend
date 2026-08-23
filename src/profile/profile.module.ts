import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from './entities/profile.entity';
import { ProfilePermisions } from './entities/profile_permisions.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, ProfilePermisions])],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
