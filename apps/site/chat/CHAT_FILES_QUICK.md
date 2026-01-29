# Быстрый список файлов для копирования чата

## 📁 Файлы для копирования

### Схемы БД
```
apps/site/src/shared/schema/messages.ts
apps/site/src/shared/schema/message-threads.ts
```
**Обновить:**
- `apps/site/src/shared/schema/index.ts` (добавить экспорты)
- `apps/site/src/shared/schema/types.ts` (добавить типы)

### Репозитории
```
apps/site/src/shared/repositories/ai-repository.ts
apps/site/src/shared/integrations/ai-service.ts
apps/site/src/shared/repositories/message-threads.repository.ts
apps/site/src/shared/repositories/messages.repository.ts
```
**Зависимости:**
- `apps/site/src/shared/repositories/BaseRepositroy.ts`
- `apps/site/src/shared/repositories/utils.ts`
- `apps/site/src/shared/repositories/me.repository.ts`
- `apps/site/src/shared/generate-aid.ts`

**Обновить:**
- `apps/site/src/shared/repositories/index.ts` (добавить экспорты)

### API Routes
```
apps/site/src/app/api/ai/chat/route.ts
apps/site/src/app/api/ai/chat/history/route.ts
apps/site/src/app/api/ai/scene/generate-description/route.ts (опционально)
apps/site/src/app/api/ai/scene/generate-chapter/route.ts (опционально)
```

### UI Компоненты
```
apps/site/src/components/workshop/neural-deck/ChatInterface.tsx
apps/site/src/components/workshop/WorkshopNeuralDeck.tsx
```

### Типы
```
apps/site/src/shared/types/shared.ts (ChatRequest, ChatResponse)
```
**Обновить:**
- `apps/site/src/shared/types.ts` (Env интерфейс)
- `apps/site/src/shared/env.ts` (buildRequestEnv)

### Утилиты
```
apps/site/src/shared/session.ts (getSession)
```

### Toast (опционально)
```
apps/site/src/hooks/use-toast.ts
packages/components/ui/toaster.tsx
packages/components/ui/toast.tsx
```
**Обновить:**
- `apps/site/src/app/layout.tsx` (добавить `<Toaster />`)

### Миграции БД
```
migrations/site-postgres/20251024_171847.sql (строки 594-634: CREATE TABLE messages, message_threads)
migrations/site-postgres/20251029_135641.sql (ALTER TABLE message_threads ADD value)
```

## 🔧 Переменные окружения (.env)
```
AI_API_URL=your_ai_gateway_url
AI_API_TOKEN=your_ai_api_token
BOT_TOKEN=your_telegram_bot_token (опционально)
TRANSCRIPTION_MODEL=whisper-large-v3 (опционально)
DATABASE_URL=postgresql://...
AUTH_SECRET=your_auth_secret
```

## 📦 NPM зависимости
```
drizzle-orm
postgres-js (или postgres)
uuid
lucide-react
```

