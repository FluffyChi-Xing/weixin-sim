import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({
    message: '用户名不可为空',
  })
  username: string;
  @IsNotEmpty({
    message: '密码不能为空',
  })
  password: string;
}
