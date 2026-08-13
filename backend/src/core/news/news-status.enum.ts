/**
 * Os três estados do ciclo editorial. O painel só oferece dois hoje
 * (`Publicado`/`Rascunho`); `archived` existe para tirar do ar sem apagar — é o
 * que o `DELETE /news/:id` faz.
 */
export enum NewsStatusEnum {
  draft = 'draft',
  published = 'published',
  archived = 'archived',
}
