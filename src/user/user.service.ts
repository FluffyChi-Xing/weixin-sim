import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { RedisService } from '../redis/redis.service';
import { md5 } from '../utils/crypto';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersVo } from './vo/users.vo';

@Injectable()
export class UserService {
  @InjectRepository(UserEntity)
  private userEntity: Repository<UserEntity>;
  private logger = new Logger();
  //注入redis service
  @Inject(RedisService)
  private redisService: RedisService;
  //注入邮箱发送服务
  @Inject(EmailService)
  private emailService: EmailService;
  //注入 jwt service
  @Inject(JwtService)
  private jwtService: JwtService;
  //注入 config service
  @Inject(ConfigService)
  private configService: ConfigService;
  //用户登录接口
  async userLogin(user: LoginDto) {
    try {
      const result = await this.userEntity.findOne({
        where: {
          username: user.username,
          password: md5(user.password),
        },
      });
      if (!result) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: '未找到该用户',
        };
      }
      const access = this.jwtService.sign(
        {
          username: user.username,
          password: user.password,
        },
        {
          expiresIn: this.configService.get('jwt_duration') || '30m',
        },
      );
      const refresh = this.jwtService.sign(
        {
          username: user.username,
          password: user.password,
        },
        {
          expiresIn: this.configService.get('jwt_refresh') || '7d',
        },
      );
      return {
        code: HttpStatus.OK,
        message: '登陆成功',
        accessToken: access,
        refreshToken: refresh,
      };
    } catch (e) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: '错误',
        data: e,
      };
    }
  }
  //用户注册接口
  async userRegister(user: RegisterDto) {
    try {
      //在 redis 中查找验证码
      //检查验证码是否过期
      const captcha = await this.redisService.get(`captcha_${user.email}`);
      if (!captcha) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: '验证码已过期',
        };
      }
      //检查验证码是否正确
      if (user.captcha !== captcha) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: '验证码错误',
        };
      }
      //检查数据库用户是否已经登录
      const login = await this.userEntity.findOne({
        where: {
          username: user.username,
        },
      });
      if (login) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: '用户已存在，请登录',
        };
      }
      //注册用户
      const member = new UserEntity();
      member.username = user.username;
      member.password = md5(user.password);
      member.email = user.email;
      member.nickName = user.nickName;
      const result = await this.userEntity.save(member);
      return {
        code: HttpStatus.OK,
        message: '注册成功',
        data: result,
      };
    } catch (e) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: '注册失败',
        data: e,
      };
    }
  }
  //发送验证码接口
  async captcha(email: string) {
    const code = Math.random().toString().slice(2, 8);
    await this.redisService.set(`captcha_${email}`, code, 60);
    if (!email) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: '邮箱不可为空',
      };
    }
    try {
      await this.emailService.sendMail({
        to: email,
        subject: '注册验证码',
        html: `
          <img src="https://nestjs.com/logo-small-gradient.76616405.svg" alt="">
          <p>你的注册验证码是 ${code}</p>
        `,
      });
      return {
        code: HttpStatus.OK,
        message: '发送成功',
      };
    } catch (e) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: '发送失败',
        data: e,
      };
    }
  }
  //刷新 token 接口
  async refreshToken(token: string) {
    try {
      const data = await this.jwtService.verify(token);
      const access = this.jwtService.sign(
        {
          username: data.username,
          password: data.password,
        },
        {
          expiresIn: this.configService.get('jwt_duration') || '30m',
        },
      );
      const refresh = this.jwtService.sign(
        {
          username: data.username,
          password: data.password,
        },
        {
          expiresIn: this.configService.get('jwt_refresh') || '7d',
        },
      );
      return {
        code: HttpStatus.OK,
        message: '刷新成功',
        access: access,
        refresh: refresh,
      };
    } catch (e) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: '更新错误',
        data: e,
      };
    }
  }
  //拉取所有用户接口
  async pullAllUser() {
    try {
      const result = await this.userEntity.find();
      let count = 0; //计数
      for (let i = 0; i < result.length; i++) {
        count++;
      }
      return {
        code: HttpStatus.OK,
        message: '拉取成功',
        data: result,
        totalCount: count,
      };
    } catch (e) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: '错误',
        data: e,
      };
    }
  }
  //根据用户名修改昵称接口
  async updateNick(name: string, nick: string) {
    try {
      const user = await this.userEntity.update(
        {
          username: name,
        },
        {
          nickName: nick,
        },
      );
      return {
        code: HttpStatus.OK,
        message: '修改成功',
        data: user,
      };
    } catch (e) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: '错误',
        data: e,
      };
    }
  }
  //搜索用户接口
  async searchOne(name: string) {
    if (!name) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: '用户名不能为空',
      };
    }
    try {
      const result = await this.userEntity.find({
        where: {
          username: name,
        },
      });
      if (!result) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: '错误，未找到该用户',
        };
      }
      const list = [];
      const vo = new UsersVo();
      for (let i = 0; i < result.length; i++) {
        vo.id = result[i].id;
        vo.username = result[i].username;
        vo.nickName = result[i].nickName;
        vo.headPic = result[i].headPic;
        list.push(vo);
      }
      return {
        code: HttpStatus.OK,
        message: '查询成功',
        data: list,
      };
    } catch (e) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: '错误',
        data: e,
      };
    }
  }
}
