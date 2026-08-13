import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Marca um campo como **derivado no servidor**: se ele vier no payload, a
 * requisição é recusada com `422 { errors: { campo: 'readOnlyField' } }`.
 *
 * Por que recusar em vez de ignorar: o `whitelist: true` do ValidationPipe
 * global apaga silenciosamente propriedade sem decorator, e silêncio aqui
 * engana o cliente — ele manda `usageCount: 7`, recebe `200` e acredita ter
 * gravado o número. Contadores e vínculos derivados (contagem de notícias por
 * categoria, `usageCount` da tag, `views`, `author` da notícia) precisam falhar
 * alto: um contador que o cliente escreve é um contador que mente.
 */
export function IsAbsent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAbsent',
      target: object.constructor,
      propertyName,
      options: {
        message: 'readOnlyField',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown): boolean {
          return value === undefined;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} é calculado pelo servidor e não pode ser enviado`;
        },
      },
    });
  };
}
