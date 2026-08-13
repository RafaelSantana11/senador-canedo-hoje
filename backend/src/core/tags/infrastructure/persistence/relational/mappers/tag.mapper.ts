import { Tag } from '../../../../domain/tag';
import { TagEntity } from '../entities/tag.entity';

/** `usageCount` chega como propriedade extra do `loadRelationCountAndMap`. */
type TagEntityWithCount = TagEntity & { usageCount?: number };

export class TagMapper {
  static toDomain(raw: TagEntityWithCount): Tag {
    const domainEntity = new Tag();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.slug = raw.slug;
    domainEntity.description = raw.description;
    domainEntity.color = raw.color;
    domainEntity.createdAt = raw.createdAt;

    if (typeof raw.usageCount === 'number') {
      domainEntity.usageCount = raw.usageCount;
    }

    return domainEntity;
  }
}
