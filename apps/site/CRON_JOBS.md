# Настройка Cron Jobs в Next.js

В Next.js есть несколько способов запускать код по расписанию. Выберите подходящий вариант в зависимости от вашего хостинга.

## 1. API Route + Внешний Cron Сервис (Универсальный способ)

### Создание Endpoint

Создайте API Route (например, `/api/cron/task-name/route.ts`) и защитите его секретным ключом:

```typescript
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ваш код здесь
  return NextResponse.json({ success: true })
}
```

### Настройка внешнего сервиса

1. **cron-job.org** (бесплатно, до 2 задач)
   - Зарегистрируйтесь на cron-job.org
   - Создайте новую задачу
   - URL: `https://your-domain.com/api/cron/task-name`
   - Заголовок: `Authorization: Bearer YOUR_CRON_SECRET`
   - Расписание: выберите частоту (каждые 5 минут, час, день и т.д.)

2. **EasyCron** (бесплатно, до 5 задач)
   - Аналогичная настройка

3. **GitHub Actions** (бесплатно)
   - Создайте файл `.github/workflows/cron.yml`:
   ```yaml
   name: Cron Job
   on:
     schedule:
       - cron: '0 */6 * * *'  # Каждые 6 часов
   jobs:
     cron:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger API
           run: |
             curl -X GET "https://your-domain.com/api/cron/task-name" \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
   ```

## 2. Vercel Cron Jobs (если используете Vercel)

Если ваше приложение развернуто на Vercel, используйте встроенные cron jobs:

### Создайте файл `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/task-name",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### API Route автоматически получит заголовок `x-vercel-cron`

```typescript
export async function GET(request: Request) {
  const cronHeader = request.headers.get('x-vercel-cron')
  if (!cronHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ваш код здесь
}
```

## 3. Cloudflare Workers Cron Triggers (если используете Cloudflare)

Если вы используете Cloudflare Pages/Workers, настройте cron триггеры в `wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]  # Каждые 6 часов
```

Затем в вашем worker добавить обработчик:

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Ваш код здесь
  }
}
```

## 4. Отдельный Worker/Сервис (для сложных задач)

Для долгих или ресурсоемких задач лучше использовать отдельный процесс:

### Вариант A: Node.js скрипт + node-cron

```bash
npm install node-cron
```

Создайте `scripts/cron-worker.ts`:

```typescript
import cron from 'node-cron'
import { NoticesRepository } from '../src/shared/repositories/notices.repository'

// Каждые 6 часов
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled task...')
  const noticesRepository = NoticesRepository.getInstance()
  await noticesRepository.sendScheduledNotifications()
})
```

Запустите отдельным процессом: `node scripts/cron-worker.ts`

### Вариант B: PM2 с расписанием

```bash
npm install pm2
```

Создайте `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'cron-worker',
      script: './scripts/cron-worker.ts',
      interpreter: 'ts-node',
      cron_restart: '0 */6 * * *',
      autorestart: false
    }
  ]
}
```

## Рекомендации

1. **Для большинства случаев**: API Route + внешний cron сервис (вариант 1)
2. **Если на Vercel**: используйте встроенные cron jobs (вариант 2)
3. **Если на Cloudflare**: используйте cron triggers (вариант 3)
4. **Для сложных задач**: отдельный worker (вариант 4)

## Безопасность

- ✅ Всегда защищайте cron endpoints секретным ключом
- ✅ Используйте переменные окружения для секретов
- ✅ Логируйте выполнение задач
- ✅ Обрабатывайте ошибки
- ✅ Устанавливайте таймауты для длительных операций

## Примеры использования

### Отправка уведомлений

```typescript
// /api/cron/send-notifications/route.ts
import { NoticesRepository } from '@/shared/repositories/notices.repository'

export async function GET(request: Request) {
  // Проверка авторизации...
  
  const noticesRepository = NoticesRepository.getInstance()
  await noticesRepository.sendScheduledNotifications()
  
  return NextResponse.json({ success: true })
}
```

### Очистка старых данных

```typescript
// /api/cron/cleanup/route.ts
export async function GET(request: Request) {
  // Проверка авторизации...
  
  // Удаление записей старше 30 дней
  await cleanupOldRecords()
  
  return NextResponse.json({ success: true })
}
```
