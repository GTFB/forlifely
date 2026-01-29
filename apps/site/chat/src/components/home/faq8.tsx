import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/packages/components/misc/layout/Container";

const faqs = {
  general: [
    {
      question: "Кому принадлежат права на текст?",
      answer:
        "Вам. Мы предоставляем инструмент, авторство полностью за вами. Все тексты, созданные с помощью NeuroPublisher, являются вашей интеллектуальной собственностью.",
    },
    {
      question: "Можно ли писать в соавторстве?",
      answer:
        "Да, наш редактор поддерживает Real-time коллаборацию (как Google Docs). Несколько авторов могут работать над одним проектом одновременно, видеть изменения друг друга в реальном времени и оставлять комментарии.",
    },
    {
      question: "Насколько велик 'ЛОР-бук'?",
      answer:
        "Мы не ограничиваем количество сущностей. Вы можете создать мир с тысячелетней историей, сотнями персонажей, локаций и событий. Графовая база знаний масштабируется под ваши потребности.",
    },
    {
      question: "Как работает RAG-архитектура?",
      answer:
        "RAG (Retrieval-Augmented Generation) позволяет ИИ обращаться к вашему ЛОР-буку при генерации текста. Система находит релевантные факты из вашего мира и использует их для создания контекстно-точных сцен, избегая галлюцинаций и противоречий.",
    },
    {
      question: "Можно ли экспортировать данные?",
      answer:
        "Да, вы можете экспортировать свои проекты в различных форматах (.docx, .epub) и получить доступ к вашим данным в любое время. Ваши данные всегда принадлежат вам.",
    },
  ],
  billing: [
    {
      question: "Как изменить тарифный план?",
      answer:
        "Вы можете изменить тарифный план в любое время в настройках аккаунта. Изменения вступят в силу в начале следующего расчетного периода.",
    },
    {
      question: "Как отменить подписку?",
      answer:
        "Вы можете отменить подписку в любое время в разделе биллинга вашего аккаунта. После отмены вы сохраните доступ до конца оплаченного периода.",
    },
    {
      question: "Какая политика возврата средств?",
      answer:
        "Мы предлагаем 30-дневную гарантию возврата средств. Если вы не удовлетворены нашей платформой, вы можете запросить возврат в течение 30 дней с момента покупки.",
    },
    {
      question: "Как обновить способ оплаты?",
      answer:
        "Вы можете обновить способ оплаты, войдя в свой аккаунт и перейдя в раздел биллинга. Там вы сможете добавить новую карту или изменить существующую.",
    },
  ],
};

const Faq8 = () => {
  return (
    <section id="faq" className="py-32">
      <Container>
        <h2 className="mb-8 text-3xl font-semibold md:mb-11 md:text-5xl">
          Часто задаваемые вопросы
        </h2>
        <div className="grid gap-4 border-t pt-4 md:grid-cols-3 md:gap-10">
          <h3 className="text-xl font-medium">Общие вопросы</h3>
          <Accordion type="multiple" className="md:col-span-2">
            {faqs.general.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="mt-10 grid gap-4 border-t pt-4 md:grid-cols-3 md:gap-10">
          <h3 className="text-xl font-medium">Оплата и тарифы</h3>
          <Accordion type="multiple" className="md:col-span-2">
            {faqs.billing.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
};

export { Faq8 };
