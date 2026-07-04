O zip contém um projeto "Google Play Clone" (Vite + React + react-router-dom + Supabase) que precisa ser migrado para o formato TanStack Start do workspace atual e publicado na Lovable.

## O que o projeto faz
- Página inicial (`/`): exibe um clone visual da Google Play Store para um app (WhatsApp), com ícone, screenshots, avaliações, botão Instalar e tutorial de instalação. Os dados vêm de uma tabela `site_settings` no Supabase.
- Página de auth (`/auth`): login com email/senha via Supabase Auth.
- Página de admin (`/admin`): painel protegido por role `admin` para editar textos, imagens, screenshots, avaliações e fazer upload de APK. Usa tabelas `site_settings`, `apps`, `user_roles` e storage bucket `site-assets`.

## Etapas de implementação

### 1. Migração do framework
- Mover `src/pages/Index.tsx`, `src/pages/Auth.tsx`, `src/pages/Admin.tsx` para rotas TanStack Start (`src/routes/index.tsx`, `src/routes/auth.tsx`, `src/routes/admin.tsx`).
- Substituir `useNavigate`/`Link` do `react-router-dom` por equivalentes do `@tanstack/react-router`.
- Substituir `<BrowserRouter>`/`<Routes>`/`<Route>` por file-based routing do TanStack.
- Adaptar o `src/App.tsx` e `src/main.tsx` para o padrão TanStack Start (`__root.tsx`, `router.tsx`).

### 2. Migração de componentes e estilos
- Copiar `src/components/ImageUpload.tsx` e `src/components/ui/*` se diferentes dos existentes.
- Copiar `src/lib/admin.ts` e `src/integrations/supabase/*`.
- Copiar `src/styles.css` se necessário (já é quase idêntico ao atual).
- Copiar o conteúdo estático `public/clone/` para `public/clone/`.

### 3. Backend (Lovable Cloud / Supabase)
- O projeto depende de Supabase. Verificar se Lovable Cloud está ativo; se não, habilitar.
- As tabelas necessárias são: `site_settings`, `apps`, `user_roles`.
- O storage bucket `site-assets` precisa existir.
- A edge function `import-play-store` precisa existir.
- Verificar se as credenciais do Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) estão configuradas.

### 4. Build e validação
- Rodar `vite build` e corrigir erros de TypeScript/import.
- Verificar se a página inicial carrega o clone corretamente.
- Verificar login e painel admin.

### 5. Publicação
- Publicar o projeto na Lovable.

## Decisão pendente
- As tabelas/buckets/functions do Supabase precisam ser recriados neste projeto? Ou o usuário já tem um projeto Supabase com tudo configurado e só precisa das credenciais?