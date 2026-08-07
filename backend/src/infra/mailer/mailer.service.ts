import { Injectable } from '@nestjs/common';
import fs from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService<AllConfigType>) {
    // Tudo vem do ConfigService (envs MAIL_*) — antes host/porta/secure eram
    // hardcoded no Gmail e o `mail.config.ts` era ignorado. Com isto, apontar
    // para o maildev em dev ou trocar de provedor é mudança de env, não de
    // código.
    const user = configService.get('mail.user', { infer: true });
    const password = configService.get('mail.password', { infer: true });

    this.transporter = nodemailer.createTransport({
      host: configService.get('mail.host', { infer: true }),
      port: configService.get('mail.port', { infer: true }),
      secure: configService.get('mail.secure', { infer: true }),
      requireTLS: configService.get('mail.requireTLS', { infer: true }),
      ignoreTLS: configService.get('mail.ignoreTLS', { infer: true }),
      // Sem credenciais (caso típico do maildev), não manda bloco `auth`:
      // um `auth` com user/pass vazios faz o nodemailer tentar autenticar e
      // falhar contra servidores que não pedem login.
      auth: user ? { user, pass: password } : undefined,
    });
  }

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath: string;
    context: Record<string, unknown>;
  }): Promise<void> {
    let html: string | undefined;
    if (templatePath) {
      const template = await fs.readFile(templatePath, 'utf-8');
      html = Handlebars.compile(template, {
        strict: true,
      })(context);
    }

    await this.transporter.sendMail({
      ...mailOptions,
      from: mailOptions.from
        ? mailOptions.from
        : `"${this.configService.get('mail.defaultName', {
            infer: true,
          })}" <${this.configService.get('mail.defaultEmail', {
            infer: true,
          })}>`,
      html: mailOptions.html ? mailOptions.html : html,
    });
  }
}
