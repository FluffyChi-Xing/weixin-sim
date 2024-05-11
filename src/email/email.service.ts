import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class EmailService {
  transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = createTransport({
      host: configService.get('email_server_host'),
      port: configService.get('email_server_port'),
      secure: false,
      auth: {
        user: configService.get('email_server_username'),
        pass: configService.get('email_server_password'),
      },
    });
  }

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: 'nest 邮箱',
        address: this.configService.get('email_server_username'),
      },
      to,
      subject,
      html,
    });
  }
}
