import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  FindOptionsRelations,
  FindOptionsSelect,
  Repository,
} from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getOne(
    id: string,
    select: FindOptionsSelect<User> | undefined = undefined,
    relations: FindOptionsRelations<User> | undefined = undefined,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
      select,
      // cache: {
      //   id: `user-id-${id}`,
      //   milliseconds: 86400000,
      // },
    });
    if (!user) {
      throw new NotFoundException(
        `Usuario con ID "${id}" no encontrado en el sistema.`,
      );
    }
    return user;
  }

  async getOneByUsername(
    username: string,
    select: FindOptionsSelect<User> | undefined = undefined,
    relations: FindOptionsRelations<User> | undefined = undefined,
  ) {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations,
      select,
      // cache: {
      //   id: `user-username-${username}`,
      //   milliseconds: 86400000,
      // },
    });
    if (!user) {
      throw new NotFoundException(
        `Usuario "${username}" no encontrado en el sistema.`,
      );
    }
    return user;
  }

  async create(user: CreateUserDto) {
    const newUser = this.usersRepository.create({
      username: user.username,
      description: user.description,
      profile_id: user.profile_id,
      password: user.password,
      email: user.email,
    });
    return this.usersRepository.save(newUser);
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      const updatedResult = await this.usersRepository.update(
        {
          id,
        },
        {
          username: dto.username,
          profile_id: dto.profile_id,
          password: dto.password,
          email: dto.email,
          status: dto.status,
          recovery_code: dto.recovery_code,
          recovery_code_expires_at: dto.recovery_code_expires_at,
        },
      );
      return updatedResult;
    } catch (error) {
      throw error;
    }
  }
}
