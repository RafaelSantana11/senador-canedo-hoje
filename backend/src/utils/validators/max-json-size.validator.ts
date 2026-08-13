import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Teto de tamanho para um campo JSON livre (`News.config`).
 *
 * Mede o **JSON serializado em bytes**, não o número de chaves: o campo é
 * propositalmente sem schema, então a única grandeza que o backend pode limitar
 * sem opinar sobre o conteúdo é o tamanho. `Buffer.byteLength` e não `length`
 * porque acento e emoji ocupam mais de um byte em UTF-8 — medir caracteres
 * deixaria passar payload maior que o limite anunciado.
 */
export function MaxJsonSize(
  maxBytes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxJsonSize',
      target: object.constructor,
      propertyName,
      constraints: [maxBytes],
      options: {
        message: 'jsonTooLarge',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === undefined || value === null) {
            return true;
          }

          const [limit] = args.constraints as [number];

          try {
            return Buffer.byteLength(JSON.stringify(value), 'utf8') <= limit;
          } catch {
            // Referência circular: `JSON.stringify` lança. Não é tamanho, mas
            // também não é objeto que o backend consiga guardar em jsonb.
            return false;
          }
        },
        defaultMessage(args: ValidationArguments): string {
          const [limit] = args.constraints as [number];
          return `${args.property} excede o limite de ${limit} bytes`;
        },
      },
    });
  };
}
