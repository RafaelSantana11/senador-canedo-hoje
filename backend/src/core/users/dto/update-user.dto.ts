import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  // `author` fica de fora: o perfil editorial (bio, isColumnist, slug) é
  // editado por `PATCH /api/v1/authors/:id`, que tem a própria regra de
  // autorização (dono ou admin). Aceitá-lo aqui daria dois caminhos de escrita
  // para o mesmo dado, com regras diferentes.
  OmitType(CreateUserDto, ['author'] as const),
) {
  // A classe UpdateUserDto agora herda todos os campos da CreateUserDto
  // como opcionais, graças ao PartialType.
  //
  // Isso inclui:
  // - name?: string;
  // - companyName?: string | null;
  // - email?: string | null;
  // - password?: string;
  // - photo?: FileDto | null;
  // - role?: RoleDto | null;
  // - status?: UserStatusEnum;
  // - trialStartDate?: Date | null;
  // - messageApiKey?: string | null;
  //
  // Não é necessário redefinir os campos aqui, a menos que você queira
  // aplicar uma validação diferente para a atualização.
}
