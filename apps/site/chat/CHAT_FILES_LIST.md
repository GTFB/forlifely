# Список файлов для копирования чата в другой проект

## 📋 Общий список файлов

### 1. Схемы базы данных (Drizzle ORM)

#### Основные схемы:
- `apps/site/src/shared/schema/messages.ts` - схема таблицы messages
- `apps/site/src/shared/schema/message-threads.ts` - схема таблицы message_threads
- `apps/site/src/shared/schema/index.ts` - экспорты схем (добавить экспорты messages и message_threads)
- `apps/site/src/shared/schema/types.ts` - типы для схем (добавить Message, NewMessage, MessageThread, NewMessageThread)

#### Зависимости схем:
- `apps/site/src/shared/schema/schema.ts` - основной файл схемы (должен экспортировать messages и message_threads)

---

### 2. Репозитории

#### Основные репозитории:
- `apps/site/src/shared/repositories/ai-repository.ts` - репозиторий для работы с AI
- `apps/site/src/shared/integrations/ai-service.ts` - сервис для работы с AI Gateway
- `apps/site/src/shared/repositories/message-threads.repository.ts` - репозиторий для message_threads
- `apps/site/src/shared/repositories/messages.repository.ts` - репозиторий для messages
- `apps/site/src/shared/repositories/index.ts` - экспорты репозиториев (добавить экспорты новых репозиториев)

#### Зависимости репозиториев:
- `apps/site/src/shared/repositories/BaseRepositroy.ts` - базовый класс репозитория
- `apps/site/src/shared/repositories/utils.ts` - утилиты (SiteDb, parseJson, createDb)
- `apps/site/src/shared/repositories/me.repository.ts` - репозиторий для получения пользователя (используется в API)
- `apps/site/src/shared/generate-aid.ts` - функция генерации AID

---

### 3. API маршруты (Next.js)

#### Основные endpoints:
- `apps/site/src/app/api/ai/chat/route.ts` - основной endpoint для чата (POST)
- `apps/site/src/app/api/ai/chat/history/route.ts` - endpoint для истории чата (GET)
- `apps/site/src/app/api/ai/scene/generate-description/route.ts` - генерация описания сцены (POST, опционально)
- `apps/site/src/app/api/ai/scene/generate-chapter/route.ts` - генерация главы (POST, опционально)

---

### 4. UI компоненты

#### Основные компоненты:
- `apps/site/src/components/workshop/neural-deck/ChatInterface.tsx` - компонент интерфейса чата
- `apps/site/src/components/workshop/WorkshopNeuralDeck.tsx` - обертка для чата (использует ChatInterface)

#### Зависимости компонентов:
- `apps/site/src/components/workshop/WorkshopProvider.tsx` - провайдер контекста (используется в ChatInterface)

---

### 5. Типы и интерфейсы

#### Основные типы:
- `apps/site/src/shared/types/shared.ts` - типы ChatRequest, ChatResponse
- `apps/site/src/shared/types.ts` - интерфейс Env (добавить AI_API_URL, AI_API_TOKEN, BOT_TOKEN, TRANSCRIPTION_MODEL)

---

### 6. Конфигурация и утилиты

#### Конфигурация:
- `apps/site/src/shared/env.ts` - функция buildRequestEnv (добавить поддержку AI переменных)
- `apps/site/src/shared/session.ts` - функции работы с сессией (getSession)

---

### 7. Миграции базы данных

#### SQL миграции:
- `migrations/site-postgres/20251024_171847.sql` - создание таблиц messages и message_threads (строки 594-634)
- `migrations/site-postgres/20251029_135641.sql` - добавление поля value в message_threads (опционально)

#### Примечание:
Если в новом проекте уже есть эти таблицы, миграции можно пропустить. Иначе нужно создать аналогичные миграции или выполнить SQL вручную.

---

### 8. Зависимости UI компонентов (Shadcn/ui)

#### Компоненты UI:
- `@/components/ui/scroll-area` - ScrollArea
- `@/components/ui/input` - Input
- `@/components/ui/button` - Button
- `@/components/ui/tabs` - Tabs (для WorkshopNeuralDeck)

#### Иконки:
- `lucide-react` - Send, Bot, User, MessageSquare, BookOpen, TrendingUp

---

### 9. Toast уведомления (для ошибок)

#### Файлы:
- `apps/site/src/hooks/use-toast.ts` - хук для toast уведомлений
- `packages/components/ui/toaster.tsx` - компонент Toaster
- `packages/components/ui/toast.tsx` - компоненты Toast
- `packages/components/ui/use-toast.ts` - реэкспорт хука (если используется)

#### Интеграция:
- `apps/site/src/app/layout.tsx` - добавить `<Toaster />` в RootLayout

---

## 📝 Пошаговая инструкция по копированию

### Шаг 1: Схемы базы данных
1. Скопировать `messages.ts` и `message-threads.ts` в `src/shared/schema/`
2. Добавить экспорты в `schema/index.ts`
3. Добавить типы в `schema/types.ts`
4. Убедиться, что `schema.ts` экспортирует новые таблицы

### Шаг 2: Репозитории
1. Скопировать все репозитории из списка
2. Проверить зависимости (BaseRepository, utils, generate-aid)
3. Добавить экспорты в `repositories/index.ts`

### Шаг 3: API маршруты
1. Создать директорию `src/app/api/ai/chat/`
2. Скопировать `route.ts` и `history/route.ts`
3. Опционально: скопировать `scene/` endpoints

### Шаг 4: UI компоненты
1. Скопировать `ChatInterface.tsx` в `components/workshop/neural-deck/`
2. Скопировать или адаптировать `WorkshopNeuralDeck.tsx`
3. Проверить зависимости (WorkshopProvider, UI компоненты)

### Шаг 5: Типы и конфигурация
1. Добавить типы в `types/shared.ts`
2. Обновить `types.ts` (Env интерфейс)
3. Обновить `env.ts` (buildRequestEnv)

### Шаг 6: Миграции
1. Выполнить SQL для создания таблиц messages и message_threads
2. Или создать новую миграцию с SQL из `20251024_171847.sql`

### Шаг 7: Переменные окружения
Добавить в `.env`:
```
AI_API_URL=your_ai_gateway_url_here
AI_API_TOKEN=your_ai_api_token_here
BOT_TOKEN=your_telegram_bot_token_here (опционально)
TRANSCRIPTION_MODEL=whisper-large-v3 (опционально)
DATABASE_URL=postgresql://...
AUTH_SECRET=your_auth_secret
```

### Шаг 8: Toast уведомления (опционально)
1. Скопировать `hooks/use-toast.ts`
2. Убедиться, что компоненты Toast доступны
3. Добавить `<Toaster />` в layout

---

## ⚠️ Важные зависимости

### NPM пакеты:
- `drizzle-orm` - ORM для работы с БД
- `postgres-js` или `postgres` - драйвер PostgreSQL
- `uuid` - генерация UUID
- `lucide-react` - иконки

### Внутренние зависимости:
- `@/lib/utils` - функция `cn` для классов
- `@/shared/schema` - схемы БД
- `@/shared/repositories` - репозитории
- `@/shared/session` - работа с сессией

---

## 🔍 Проверка после копирования

1. ✅ Таблицы messages и message_threads созданы в БД
2. ✅ Переменные окружения настроены
3. ✅ API endpoints доступны (`/api/ai/chat`, `/api/ai/chat/history`)
4. ✅ Компонент ChatInterface отображается
5. ✅ Сообщения сохраняются в БД
6. ✅ История чата загружается при перезагрузке страницы
7. ✅ Toast уведомления работают (если добавлены)

---

## 📌 Примечания

- Если в новом проекте другая структура папок, нужно будет обновить импорты
- Убедитесь, что в проекте есть таблица `humans` (для связи по `haid`)
- Проверьте, что `MeRepository` доступен и работает корректно
- Если используется другая система аутентификации, нужно адаптировать `getSession`

