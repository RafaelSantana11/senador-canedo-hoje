# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## Deploy da demo (GitHub Pages)

O push na `main` que toque `frontend/**` dispara `.github/workflows/deploy-frontend-pages.yml`,
que gera um export estático e publica em https://rafaelsantana11.github.io/senador-canedo-hoje/.

O export é opt-in por env, então `npm run dev` e `npm run build` normais não mudam:

```bash
NEXT_OUTPUT=export NEXT_PUBLIC_BASE_PATH=/senador-canedo-hoje npm run build   # gera out/
```

### Ao mexer em imagens

O Pages serve o site de um subpath (`/senador-canedo-hoje`), e paths absolutos de
`public/` não recebem esse prefixo sozinhos. Regras:

- `<Image>` do `next/image` e `<Link>` — nada a fazer, já são prefixados.
- `<img src="/...">`, `backgroundImage: url(/...)` e URLs em `metadata` — passe por
  `assetPath()` de `@/lib/utils`.

Sem isso a imagem funciona em `dev` e 404 só na demo publicada.
