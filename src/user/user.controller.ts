import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequireLogin } from '../utils/user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  //用户登录
  @Post('login')
  async userLogin(@Body() user: LoginDto) {
    return await this.userService.userLogin(user);
  }
  //用户注册
  @Post('register')
  async userRegister(@Body() user: RegisterDto) {
    return await this.userService.userRegister(user);
  }
  //获取验证码
  @Get('captcha')
  async getCaptcha(@Query('email') email: string) {
    return await this.userService.captcha(email);
  }
  //刷新token
  @Post('refresh')
  async refreshToken(@Query('token') token: string) {
    return await this.userService.refreshToken(token);
  }
  //拉取所有用户
  @Get('pullUsers')
  @RequireLogin()
  async pullAllUser() {
    return this.userService.pullAllUser();
  }
  //修改昵称
  @Post('nickname')
  @RequireLogin()
  async changeNick(@Query('name') name: string, @Query('nick') nick: string) {
    return await this.userService.updateNick(name, nick);
  }
  @Get('searchOne')
  @RequireLogin()
  async searchOne(@Query('name') name: string) {
    return await this.userService.searchOne(name);
  }
}
