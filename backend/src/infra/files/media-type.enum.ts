/**
 * Classificação de alto nível do arquivo, **derivada do `mimeType`** — não é
 * coluna e não é editável.
 *
 * O protótipo do painel guardava `type` como campo escolhido pelo usuário no
 * formulário de mídia; não é opinião: um `image/png` é imagem independente do
 * que o formulário diga. Derivar aqui garante que o filtro do acervo e o que o
 * navegador realmente recebe nunca divirjam.
 */
export enum MediaTypeEnum {
  image = 'image',
  video = 'video',
  document = 'document',
}

/**
 * `image/*` → `image`, `video/*` → `video`, qualquer outra coisa → `document`.
 *
 * Sem `mimeType` (arquivos anteriores à Parte 5, que subiram sem metadado
 * nenhum) devolve `null` em vez de chutar `document`: o acervo antigo aparece
 * como "tipo desconhecido", que é a verdade, e não como documento.
 */
export const resolveMediaType = (
  mimeType?: string | null,
): MediaTypeEnum | null => {
  if (!mimeType) {
    return null;
  }

  const normalized = mimeType.toLowerCase();

  if (normalized.startsWith('image/')) {
    return MediaTypeEnum.image;
  }

  if (normalized.startsWith('video/')) {
    return MediaTypeEnum.video;
  }

  return MediaTypeEnum.document;
};
