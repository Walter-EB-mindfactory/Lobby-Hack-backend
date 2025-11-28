import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    googleId?: string;
    email: string;
    name: string;
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create({
      ...registerDto,
      roles: [UserRole.VISITANTE],
    });

    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return this.generateAuthResponse(user);
  }

  async validateUser(email: string): Promise<User | null> {
    return this.usersService.findByEmail(email);
  }

  async googleLogin(req: any): Promise<AuthResponse> {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    const { email, firstName, lastName, googleId } = req.user;

    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      user = await this.usersService.findByEmail(email);

      if (user && !user.googleId) {
        // Link existing account with Google
        user = await this.usersService.update(user.id, { googleId });
      } else if (!user) {
        // Create new user
        user = await this.usersService.create({
          email,
          firstName,
          lastName,
          roles: [UserRole.VISITANTE],
        });
        user.googleId = googleId;
        user = await this.usersService.update(user.id, { googleId });
      }
    }

    return this.generateAuthResponse(user);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      };

      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateAuthResponse(user: User): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        name: fullName,
        roles: user.roles,
      },
    };
  }
}
