"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "@/hooks/use-translations";

interface RolePageShellProps {
  title: string;
  description: string;
  role: "mentor" | "member";
}

type ScreenStat = {
  label: string;
  value: string;
  hint: string;
};

type ScreenActivity = {
  title: string;
  time: string;
  status: string;
};

type ScreenAction = {
  label: string;
  href: string;
  variant?: "default" | "outlinePrimary";
};

type ScreenContent = {
  stats: ScreenStat[];
  checklist: string[];
  activity: ScreenActivity[];
  actions: ScreenAction[];
};

export function RolePageShell({ title, description, role }: RolePageShellProps) {
  const pathname = usePathname() ?? "";
  const { locale, translations } = useTranslations();

  const pathKey = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .join("_") || "dashboard";

  const localizedPage = translations?.cabinet?.[role]?.pages?.[pathKey] as
    | {
        title?: string;
        description?: string;
        workflows?: string[];
        outcomes?: string[];
        screen?: Partial<ScreenContent>;
      }
    | undefined;

  const resolvedTitle = localizedPage?.title ?? title;
  const resolvedDescription = localizedPage?.description ?? description;

  const category = pathname.includes("/sessions/")
    ? "sessions"
    : pathname.includes("/payments/")
      ? "payments"
      : pathname.includes("/health/")
        ? "health"
        : pathname.includes("/bookings")
          ? "bookings"
          : pathname.includes("/settings")
            ? "settings"
            : pathname.includes("/profile")
              ? "profile"
              : pathname.includes("/matching") || pathname.includes("/search") || pathname.includes("/favorites")
                ? "matching"
                : pathname.includes("/privacy")
                  ? "privacy"
                  : pathname.includes("/journal")
                    ? "journal"
                    : pathname.includes("/content-library")
                      ? "content"
                      : pathname.includes("/notifications")
                        ? "notifications"
                        : "dashboard";

  const fallbackWorkflows: Record<string, string[]> = locale === "ru"
    ? {
        dashboard: [
          "Проверьте расписание и фокус-задачи на сегодня.",
          "Перейдите в ключевые сценарии одним действием.",
          "Закройте срочные пункты перед следующей сессией.",
        ],
        profile: [
          "Обновите профиль и контекст работы.",
          "Проверьте обязательные поля и видимость данных.",
          "Сохраните настройки, влияющие на matching.",
        ],
        matching: [
          "Проверьте рекомендации и фильтры поиска.",
          "Зафиксируйте подходящие варианты в избранном.",
          "Сделайте shortlist перед бронированием.",
        ],
        bookings: [
          "Отфильтруйте предстоящие/прошедшие сессии.",
          "Откройте детали встречи и статус выполнения.",
          "Подготовьте последующие действия по сессии.",
        ],
        sessions: [
          "Пройдите pre-session проверки устройств.",
          "Синхронизируйте статус входа и готовности.",
          "После сессии завершите summary и action items.",
        ],
        payments: [
          "Проверьте баланс, зачисления и списания.",
          "Сверьте периодические выплаты/расходы.",
          "Закройте финансовые вопросы по сессиям.",
        ],
        health: [
          "Зафиксируйте метрики и настроение за день.",
          "Проверьте динамику на графиках.",
          "Обновите настройки лекарств и шеринга.",
        ],
        content: [
          "Откройте материалы по текущей цели.",
          "Подберите контент к теме следующей сессии.",
          "Сохраните полезные материалы для повторного доступа.",
        ],
        journal: [
          "Добавьте новую запись с выводами.",
          "Проверьте предыдущие заметки перед сессией.",
          "Актуализируйте задачи по прогрессу.",
        ],
        privacy: [
          "Проверьте согласия на обработку данных.",
          "Обновите правила доступа к персональным данным.",
          "Просмотрите историю изменений согласий.",
        ],
        settings: [
          "Проверьте безопасность и вход в аккаунт.",
          "Настройте уведомления и рабочие предпочтения.",
          "Подтвердите ключевые параметры роли.",
        ],
        notifications: [
          "Обработайте новые уведомления по приоритету.",
          "Отметьте неактуальные уведомления как прочитанные.",
          "Сфокусируйтесь на задачах с ближайшим дедлайном.",
        ],
      }
    : {
        dashboard: [
          "Review today's schedule and top-priority tasks.",
          "Jump into key workflows with one click.",
          "Resolve urgent items before the next session.",
        ],
        profile: [
          "Update profile and working context.",
          "Validate required fields and visibility.",
          "Save settings that affect matching quality.",
        ],
        matching: [
          "Review recommendations and search filters.",
          "Pin strong candidates to favorites.",
          "Build a short list before booking.",
        ],
        bookings: [
          "Filter upcoming and completed sessions.",
          "Open details and follow-up status.",
          "Prepare next steps from booking records.",
        ],
        sessions: [
          "Complete pre-session device checks.",
          "Align join status and room readiness.",
          "Finalize summary and action items after session.",
        ],
        payments: [
          "Check credits, payouts, and transactions.",
          "Review period totals and financial status.",
          "Close payment-related tasks for sessions.",
        ],
        health: [
          "Capture daily health and mood entries.",
          "Review trends and changes over time.",
          "Update medication and sharing preferences.",
        ],
        content: [
          "Open resources relevant to current goals.",
          "Prepare content for upcoming session topics.",
          "Save materials for faster follow-up.",
        ],
        journal: [
          "Create a structured reflection entry.",
          "Review previous notes before sessions.",
          "Update progress-related action points.",
        ],
        privacy: [
          "Review active consent and privacy settings.",
          "Adjust data-sharing boundaries by category.",
          "Check consent history for traceability.",
        ],
        settings: [
          "Validate account security configuration.",
          "Tune notifications and preferences.",
          "Confirm role-specific operating settings.",
        ],
        notifications: [
          "Process new alerts by priority.",
          "Mark non-critical items as completed.",
          "Focus on time-sensitive events first.",
        ],
      };

  const workflows = localizedPage?.workflows?.length
    ? localizedPage.workflows
    : fallbackWorkflows[category] ?? fallbackWorkflows.dashboard;

  const fallbackScreen: Record<string, ScreenContent> = locale === "ru"
    ? {
        dashboard: {
          stats: [
            { label: "Сегодняшние сессии", value: "4", hint: "2 ближайшие в течение 3 часов" },
            { label: "Открытые задачи", value: "7", hint: "3 критические требуют реакции" },
            { label: "Выполнено за неделю", value: "82%", hint: "Стабильный темп выполнения" },
          ],
          checklist: workflows,
          activity: [
            { title: "Проверка readiness перед сессией", time: "10:30", status: "Pending" },
            { title: "Обновление summary по завершенной встрече", time: "12:00", status: "In progress" },
            { title: "Подтверждение расписания на завтра", time: "16:30", status: "Done" },
          ],
          actions: [
            { label: "Открыть календарь", href: `${role === "mentor" ? "/mentor" : "/member"}/bookings` },
            { label: "Перейти в сессии", href: `${role === "mentor" ? "/mentor" : "/member"}/sessions/preparation`, variant: "outlinePrimary" },
          ],
        },
        profile: {
          stats: [
            { label: "Полнота профиля", value: "78%", hint: "Заполните 3 обязательных поля" },
            { label: "Обновлено сегодня", value: "2", hint: "Изменения в био и навыках" },
            { label: "Видимость", value: "Public", hint: "Профиль доступен для matching" },
          ],
          checklist: workflows,
          activity: [
            { title: "Проверить контактные данные", time: "Сегодня", status: "Pending" },
            { title: "Обновить профессиональные теги", time: "Эта неделя", status: "In progress" },
            { title: "Сохранить изменения профиля", time: "После ревью", status: "Done" },
          ],
          actions: [
            { label: "Редактировать профиль", href: role === "mentor" ? "/mentor/profile/edit" : "/member/profile/create" },
            { label: "Открыть настройки", href: `${role === "mentor" ? "/mentor" : "/member"}/settings`, variant: "outlinePrimary" },
          ],
        },
        bookings: {
          stats: [
            { label: "Предстоящие встречи", value: "5", hint: "3 на этой неделе" },
            { label: "Прошедшие", value: "14", hint: "Доступны summary и notes" },
            { label: "Отмененные", value: "1", hint: "Требуется перенос" },
          ],
          checklist: workflows,
          activity: [
            { title: "Подтвердить ближайший слот", time: "Сегодня", status: "Pending" },
            { title: "Проверить статус оплаты", time: "Перед сессией", status: "In progress" },
            { title: "Отправить post-session follow-up", time: "После встречи", status: "Done" },
          ],
          actions: [
            { label: "Открыть бронирования", href: `${role === "mentor" ? "/mentor" : "/member"}/bookings` },
            { label: "Подготовка к сессии", href: `${role === "mentor" ? "/mentor" : "/member"}/sessions/preparation`, variant: "outlinePrimary" },
          ],
        },
        sessions: {
          stats: [
            { label: "Текущий статус", value: "Ready", hint: "Проверки камеры и микрофона пройдены" },
            { label: "Сессии сегодня", value: "3", hint: "1 активная, 2 запланированы" },
            { label: "Средняя длительность", value: "47m", hint: "За последние 14 дней" },
          ],
          checklist: workflows,
          activity: [
            { title: "Проверка соединения и устройств", time: "За 15 мин", status: "Pending" },
            { title: "Синхронизация заметок в комнате", time: "Во время сессии", status: "In progress" },
            { title: "Подтверждение итогов сессии", time: "После завершения", status: "Done" },
          ],
          actions: [
            { label: "Открыть комнату сессии", href: `${role === "mentor" ? "/mentor" : "/member"}/sessions/room` },
            { label: "Перейти к summary", href: `${role === "mentor" ? "/mentor" : "/member"}/sessions/summary`, variant: "outlinePrimary" },
          ],
        },
        payments: {
          stats: [
            { label: role === "mentor" ? "Ожидаемая выплата" : "Доступные кредиты", value: role === "mentor" ? "$540" : "18", hint: role === "mentor" ? "Следующая выплата: пятница" : "Хватает на 3 сессии" },
            { label: "Транзакции за месяц", value: "12", hint: "С полной детализацией" },
            { label: "Статус расчетов", value: "Healthy", hint: "Нет блокирующих операций" },
          ],
          checklist: workflows,
          activity: [
            { title: role === "mentor" ? "Сверить payout period" : "Проверить баланс и покупки", time: "Сегодня", status: "Pending" },
            { title: "Проверить детализацию транзакций", time: "Эта неделя", status: "In progress" },
            { title: "Закрыть финансовые задачи", time: "До конца периода", status: "Done" },
          ],
          actions: role === "mentor"
            ? [
                { label: "Открыть выплаты", href: "/mentor/payments/payouts" },
                { label: "Открыть настройки", href: "/mentor/settings", variant: "outlinePrimary" },
              ]
            : [
                { label: "Купить кредиты", href: "/member/payments/credits" },
                { label: "История транзакций", href: "/member/payments/history", variant: "outlinePrimary" },
              ],
        },
      }
    : {
        dashboard: {
          stats: [
            { label: "Sessions today", value: "4", hint: "2 starting in the next 3 hours" },
            { label: "Open tasks", value: "7", hint: "3 high-priority items" },
            { label: "Weekly completion", value: "82%", hint: "Stable execution pace" },
          ],
          checklist: workflows,
          activity: [
            { title: "Readiness check before session", time: "10:30", status: "Pending" },
            { title: "Update summary for completed session", time: "12:00", status: "In progress" },
            { title: "Confirm tomorrow schedule", time: "16:30", status: "Done" },
          ],
          actions: [
            { label: "Open bookings", href: `${role === "mentor" ? "/mentor" : "/member"}/bookings` },
            { label: "Open sessions", href: `${role === "mentor" ? "/mentor" : "/member"}/sessions/preparation`, variant: "outlinePrimary" },
          ],
        },
        profile: {
          stats: [
            { label: "Profile completeness", value: "78%", hint: "3 required fields left" },
            { label: "Updated today", value: "2", hint: "Bio and skills changed" },
            { label: "Visibility", value: "Public", hint: "Profile visible for matching" },
          ],
          checklist: workflows,
          activity: [
            { title: "Validate contact details", time: "Today", status: "Pending" },
            { title: "Refresh professional tags", time: "This week", status: "In progress" },
            { title: "Publish profile changes", time: "After review", status: "Done" },
          ],
          actions: [
            { label: "Edit profile", href: role === "mentor" ? "/mentor/profile/edit" : "/member/profile/create" },
            { label: "Open settings", href: `${role === "mentor" ? "/mentor" : "/member"}/settings`, variant: "outlinePrimary" },
          ],
        },
        bookings: {
          stats: [
            { label: "Upcoming sessions", value: "5", hint: "3 this week" },
            { label: "Completed sessions", value: "14", hint: "Summaries available" },
            { label: "Canceled", value: "1", hint: "Needs reschedule" },
          ],
          checklist: workflows,
          activity: [
            { title: "Confirm next booking slot", time: "Today", status: "Pending" },
            { title: "Verify payment status", time: "Before session", status: "In progress" },
            { title: "Send post-session follow-up", time: "After session", status: "Done" },
          ],
          actions: [
            { label: "Open bookings", href: `${role === "mentor" ? "/mentor" : "/member"}/bookings` },
            { label: "Session preparation", href: `${role === "mentor" ? "/mentor" : "/member"}/sessions/preparation`, variant: "outlinePrimary" },
          ],
        },
        sessions: {
          stats: [
            { label: "Current readiness", value: "Ready", hint: "Camera and mic checks passed" },
            { label: "Sessions today", value: "3", hint: "1 active, 2 upcoming" },
            { label: "Average duration", value: "47m", hint: "Last 14 days" },
          ],
          checklist: workflows,
          activity: [
            { title: "Run connection and device checks", time: "T-15 min", status: "Pending" },
            { title: "Sync room notes and context", time: "In session", status: "In progress" },
            { title: "Approve session summary", time: "After end", status: "Done" },
          ],
          actions: [
            { label: "Open session room", href: `${role === "mentor" ? "/mentor" : "/member"}/sessions/room` },
            { label: "Open session summary", href: `${role === "mentor" ? "/mentor" : "/member"}/sessions/summary`, variant: "outlinePrimary" },
          ],
        },
        payments: {
          stats: [
            { label: role === "mentor" ? "Expected payout" : "Available credits", value: role === "mentor" ? "$540" : "18", hint: role === "mentor" ? "Next payout: Friday" : "Enough for ~3 sessions" },
            { label: "Transactions this month", value: "12", hint: "Full detail available" },
            { label: "Financial health", value: "Healthy", hint: "No blocked operations" },
          ],
          checklist: workflows,
          activity: [
            { title: role === "mentor" ? "Review payout period" : "Review balance and purchases", time: "Today", status: "Pending" },
            { title: "Validate transaction details", time: "This week", status: "In progress" },
            { title: "Close finance follow-up actions", time: "Before period close", status: "Done" },
          ],
          actions: role === "mentor"
            ? [
                { label: "Open payouts", href: "/mentor/payments/payouts" },
                { label: "Open settings", href: "/mentor/settings", variant: "outlinePrimary" },
              ]
            : [
                { label: "Buy credits", href: "/member/payments/credits" },
                { label: "Open transactions", href: "/member/payments/history", variant: "outlinePrimary" },
              ],
        },
      };

  const screenKey = category === "sessions" || category === "payments" ? category : pathKey;
  const screenData = localizedPage?.screen;
  const resolvedScreen = fallbackScreen[screenKey] ?? fallbackScreen.dashboard;
  const stats = screenData?.stats?.length ? screenData.stats : resolvedScreen.stats;
  const checklist = screenData?.checklist?.length ? screenData.checklist : resolvedScreen.checklist;
  const activity = screenData?.activity?.length ? screenData.activity : resolvedScreen.activity;
  const actions = screenData?.actions?.length ? screenData.actions : resolvedScreen.actions;

  const sectionTitle = locale === "ru" ? "Что нужно сделать на этом экране" : "What to do on this screen";
  const activityTitle = locale === "ru" ? "Лента активности" : "Activity timeline";
  const actionsTitle = locale === "ru" ? "Действия" : "Actions";
  const statsTitle = locale === "ru" ? "Ключевые показатели" : "Key indicators";

  const roleRoot = role === "mentor" ? "/mentor" : "/member";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">{role}</Badge>
            <Badge variant="secondary">{pathKey}</Badge>
          </div>
          <CardTitle>{resolvedTitle}</CardTitle>
          <CardDescription>{resolvedDescription}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{statsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{sectionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {checklist.map((item) => (
                <li key={item} className="list-disc pl-5">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{activityTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={`${item.title}-${item.time}`} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{actionsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button asChild key={action.href} variant={action.variant ?? "default"}>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
            <Button asChild variant="ghost">
              <Link href={roleRoot}>{locale === "ru" ? "В кабинет" : "Open dashboard"}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

