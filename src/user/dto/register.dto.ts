import { IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({
    message: '用户名不能为空',
  })
  username: string;
  @IsNotEmpty({
    message: '密码不能为空',
  })
  password: string;
  @IsNotEmpty({
    message: '昵称不能为空',
  })
  nickName: string;
  @IsNotEmpty({
    message: '邮箱不能为空',
  })
  email: string;
  @IsNotEmpty({
    message: '验证码不能为空',
  })
  captcha: string;
}
