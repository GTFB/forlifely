import Link from 'next/link'

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Входящие машины — инструкция</h1>
        <p className="text-muted-foreground">Как создать, отредактировать и отправить на подтверждение.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Где найти</h2>
        <p>
          Откройте раздел{' '}
          <Link href="/s/receiving" className="text-primary underline underline-offset-4">
            Входящие машины
          </Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Создание заявки</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Нажмите «Добавить».</li>
          <li>
            Заполните поля: <strong>Название</strong> (обязательно), <strong>Дата</strong> (по желанию),
            <strong> Стоимость транспорта</strong> (по желанию).
          </li>
          <li>
            Поля <strong>Владелец</strong> и <strong>Склад</strong> подставляются автоматически из вашего профиля.
          </li>
          <li>
            Нажмите «Сохранить». Заявка создаётся со статусом <code>IN_PROGRESS</code> и кодом <code>full_baid</code>.
          </li>
        </ol>
        <p className="text-sm text-muted-foreground">Дата хранится в data_in.date. Стоимость — в data_in.transportCost.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Добавление позиций</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Откройте заявку (иконка со стрелкой) или кнопку «Редактировать».</li>
          <li>Нажмите «Добавить позицию».</li>
          <li>Выберите вариант товара и укажите количество, затем «Добавить».</li>
          <li>Позиции можно удалять до отправки на подтверждение.</li>
        </ol>
        <p className="text-sm text-muted-foreground">Добавление и редактирование доступно только со статусом <code>IN_PROGRESS</code>.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Редактирование заявки</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Во вкладке «Edit» можно изменить название, дату и стоимость транспорта.</li>
          <li>После отправки на подтверждение редактирование блокируется.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Отправка на подтверждение</h2>
        <p>
          Нажмите «Отправить на подтверждение». Статус изменится, редактирование и добавление позиций станет
          недоступно.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Полезно знать</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>В списке отображаются только заявки вашего склада (по location_laid).</li>
          <li>
            Переход к заявке: <code>/s/receiving/edit?full_baid=...</code> через иконку «внешняя ссылка».
          </li>
          <li>Удаление — мягкое (soft delete), заявка скрывается из списков.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Если что-то пошло не так</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Не подставился владелец/склад — проверьте, что у пользователя есть сотрудник и настроена локация.
            Обратитесь к администратору.
          </li>
          <li>«Invalid Date» — укажите дату в формате ГГГГ-ММ-ДД или оставьте пустой.</li>
          <li>Нет вариантов товара — проверьте наличие product_variants и права доступа.</li>
          <li>Не вижу свою заявку — убедитесь, что она относится к текущему складу.</li>
        </ul>
      </section>
    </main>
  )
}

