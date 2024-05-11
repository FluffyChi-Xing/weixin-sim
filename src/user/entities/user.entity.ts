import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'users',
})
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    length: 50,
    comment: '用户名',
    unique: true, //唯一性约束
  })
  username: string;
  @Column({
    length: 50,
    comment: '密码',
  })
  password: string;
  @Column({
    length: 50,
    comment: '昵称',
  })
  nickName: string;
  @Column({
    length: 50,
    comment: '邮箱',
  })
  email: string;
  @Column({
    length: 100,
    comment: '头像url',
    nullable: true,
  })
  headPic: string;
  @CreateDateColumn()
  createTime: Date;
  @UpdateDateColumn()
  updateTime: Date;
}
