import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class InitUsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.createDefaultUsers();
  }

  private async createDefaultUsers() {
    const defaultUsers = [
      {
        email: 'admin@lobby.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Sistema',
        roles: [UserRole.ADMIN],
      },
      {
        email: 'recepcionista@lobby.com',
        password: 'recepc123',
        firstName: 'Juan',
        lastName: 'Recepcionista',
        roles: [UserRole.RECEPCIONISTA],
      },
      {
        email: 'autorizante@lobby.com',
        password: 'autor123',
        firstName: 'María',
        lastName: 'Autorizante',
        roles: [UserRole.AUTORIZANTE],
      },
    ];

    for (const userData of defaultUsers) {
      const exists = await this.usersRepository.findOne({
        where: { email: userData.email },
      });

      if (!exists) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = this.usersRepository.create({
          email: userData.email,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          roles: userData.roles,
        });
        await this.usersRepository.save(user);
        console.log(`✅ Usuario creado: ${userData.email}`);
      } else {
        console.log(`ℹ️  Usuario ya existe: ${userData.email}`);
      }
    }
  }
}
