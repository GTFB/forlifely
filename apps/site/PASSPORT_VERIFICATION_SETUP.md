# Настройка верификации селфи с паспортом

## Обзор

Система автоматической верификации селфи с паспортом использует Google Cloud Vision API для:
- Распознавания лиц на фотографиях
- Сравнения лиц на селфи и паспорте
- Извлечения текста из паспорта (OCR)
- Сверки ФИО из паспорта с данными пользователя

## Получение Google Vision API Key

### 1. Создайте проект в Google Cloud Console

1. Перейдите на https://console.cloud.google.com/
2. Войдите под учетной записью Google
3. Создайте новый проект или выберите существующий

### 2. Включите Cloud Vision API

1. Меню → **APIs & Services** → **Library**
2. Найдите **Cloud Vision API**
3. Нажмите **Enable**

### 3. Создайте API Key

**Вариант A: Простой API Key (для разработки)**

1. **APIs & Services** → **Credentials**
2. **+ CREATE CREDENTIALS** → **API key**
3. Скопируйте созданный ключ
4. (Опционально) Ограничьте ключ для Cloud Vision API

**Вариант B: Service Account (для production)**

1. **APIs & Services** → **Credentials** 
2. **+ CREATE CREDENTIALS** → **Service account**
3. Заполните форму:
   - Service account name: `esnad-vision-service`
   - Role: **Cloud Vision API User**
4. Нажмите **Create key** → выберите **JSON**
5. Сохраните JSON файл

### 4. Добавьте ключ в .env

**Для API Key:**
```env
GOOGLE_VISION_API_KEY=AIzaSy...ваш_ключ
```

**Для Service Account:**
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
# Или как строка:
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account",...}'
```

## Использование

### Для пользователей (клиентов)

1. Перейдите в **Мой профиль** → вкладка **Документы KYC**
2. Сначала загрузите **фото паспорта (главная страница)**
3. Затем загрузите **Селфи с паспортом**
4. Система автоматически:
   - Сравнит лица
   - Извлечёт ФИО из паспорта
   - Сверит с данными профиля
   - Покажет результат верификации

### Требования к фото

**Селфи с паспортом:**
- ✅ Держите паспорт открытым на главной странице рядом с лицом
- ✅ Фото паспорта и ваше лицо должны быть четко видны
- ✅ Хорошее освещение (лучше при дневном свете)
- ✅ Только одно лицо в кадре - ваше
- ✅ Формат: JPG, PNG, WebP (не PDF)
- ❌ Не закрывайте фото в паспорте
- ❌ Избегайте бликов и размытости

## API Endpoints

### POST `/api/esnad/v1/c/profile/verify-selfie-with-passport`

Загружает селфи с паспортом и выполняет верификацию.

**Request:**
```
Content-Type: multipart/form-data

file: File (селфи с паспортом)
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "facesMatch": true,
  "confidence": 0.95,
  "message": "Верификация пройдена успешно!",
  "details": {
    "facesInSelfie": 1,
    "facesInPassport": 1,
    "nameMatch": true,
    "reasons": []
  },
  "document": {
    "id": "selfie_with_passport",
    "mediaUuid": "...",
    "uploadedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## Troubleshooting

### Ошибка: "GOOGLE_VISION_API_KEY not configured"

**Решение:** Убедитесь, что API key добавлен в `.env.local` или `.env`

### Ошибка: "Сначала загрузите фото паспорта"

**Решение:** Перед загрузкой селфи обязательно загрузите скан паспорта

### Низкая уверенность сравнения (<80%)

**Причины:**
- Плохое освещение
- Размытое фото
- Паспорт частично закрыт
- Несколько лиц в кадре

**Решение:** Переснимите фото при хорошем освещении

## Стоимость

Google Cloud Vision API:
- **Бесплатно:** 1000 запросов/месяц
- **После:** $1.50 за 1000 запросов

**Рекомендация:** Настройте лимиты в Google Cloud Console

## Безопасность

⚠️ **Важно:**
- Не коммитьте API ключи в Git
- Используйте переменные окружения
- Добавьте `.env.local` в `.gitignore`
- Для production используйте Service Account

## Альтернатива: AWS Rekognition

Код также поддерживает AWS Rekognition. См. документацию в:
`apps/site/src/shared/services/recognition/README.md`

