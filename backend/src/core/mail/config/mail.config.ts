import { registerAs } from '@nestjs/config';
import {
  IsString,
  IsOptional,
  IsEmail,
} from 'class-validator';
import validateConfig from '../../../utils/validate-config';
import { MailConfig } from './mail-config.type';

class EnvironmentVariablesValidator {
  @IsEmail()
  @IsOptional()
  MAIL_DEFAULT_EMAIL: string;

  @IsString()
  @IsOptional()
  MAIL_DEFAULT_NAME: string;
}

export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    port: 587,
    host: 'smtp.gmail.com',
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    defaultEmail: process.env.MAIL_DEFAULT_EMAIL,
    defaultName: process.env.MAIL_DEFAULT_NAME,
    ignoreTLS: false,
    secure: false,
    requireTLS: true,
  };
});
