import { generateAid } from '../generate-aid'
import type { SeedDefinition, SeedData } from './index'

// Legal document template with multilingual support
type LegalDocumentTemplate = {
  title: { en: string; de: string; fr: string; es: string; ua: string }
  slug: string
  content: { en: string; de: string; fr: string; es: string; ua: string }
  seoTitle?: { en: string; de: string; fr: string; es: string; ua: string }
  seoDescription?: { en: string; de: string; fr: string; es: string; ua: string }
  seoKeywords?: { en: string; de: string; fr: string; es: string; ua: string }
  order: number
}

// Raw legal document data
const legalDocumentTemplates: LegalDocumentTemplate[] = [
  {
    title: {
      en: 'User Agreement',
      de: 'Nutzungsbedingungen',
      fr: 'Accord utilisateur',
      es: 'Acuerdo de usuario',
      ua: 'Угода користувача',
    },
    slug: 'user-agreement',
    content: {
      en: `# User Agreement

## 1. General Provisions

This User Agreement (hereinafter – "Agreement") governs the relationship between the website administration (hereinafter – "Administration") and the website user (hereinafter – "User") when using the website.

## 2. Subject of the Agreement

2.1. The Administration grants the User the right to use the website under the terms set forth in this Agreement.

2.2. The User's use of the website means full and unconditional acceptance of the terms of this Agreement.

## 3. Rights and Obligations of the Parties

3.1. The User undertakes to:
- Use the website in accordance with its intended purpose
- Not violate the rights of third parties
- Comply with legal requirements

3.2. The Administration undertakes to:
- Ensure the website's functionality
- Protect the User's personal data
- Provide up-to-date information

## 4. Liability

4.1. The Administration is not responsible for the User's actions when using the website.

4.2. The User is fully responsible for their actions on the website.

## 5. Final Provisions

5.1. This Agreement may be amended by the Administration at any time.

5.2. All disputes are resolved through negotiations, and if it is impossible to reach an agreement – through legal proceedings.

Last updated: ${new Date().toLocaleDateString('en-US')}`,
      de: `# Nutzungsbedingungen

## 1. Allgemeine Bestimmungen

Diese Nutzungsbedingungen (nachfolgend – "Vereinbarung") regeln die Beziehung zwischen der Website-Verwaltung (nachfolgend – "Verwaltung") und dem Website-Benutzer (nachfolgend – "Benutzer") bei der Nutzung der Website.

## 2. Gegenstand der Vereinbarung

2.1. Die Verwaltung gewährt dem Benutzer das Recht, die Website unter den in dieser Vereinbarung festgelegten Bedingungen zu nutzen.

2.2. Die Nutzung der Website durch den Benutzer bedeutet vollständige und bedingungslose Annahme der Bedingungen dieser Vereinbarung.

## 3. Rechte und Pflichten der Parteien

3.1. Der Benutzer verpflichtet sich:
- Die Website entsprechend ihrem Zweck zu nutzen
- Die Rechte Dritter nicht zu verletzen
- Gesetzliche Anforderungen einzuhalten

3.2. Die Verwaltung verpflichtet sich:
- Die Funktionalität der Website sicherzustellen
- Die persönlichen Daten des Benutzers zu schützen
- Aktuelle Informationen bereitzustellen

## 4. Haftung

4.1. Die Verwaltung ist nicht verantwortlich für die Handlungen des Benutzers bei der Nutzung der Website.

4.2. Der Benutzer ist vollständig verantwortlich für seine Handlungen auf der Website.

## 5. Schlussbestimmungen

5.1. Diese Vereinbarung kann von der Verwaltung jederzeit geändert werden.

5.2. Alle Streitigkeiten werden durch Verhandlungen gelöst, und wenn eine Einigung nicht möglich ist – durch Gerichtsverfahren.

Zuletzt aktualisiert: ${new Date().toLocaleDateString('de-DE')}`,
      fr: `# Accord utilisateur

## 1. Dispositions générales

Le présent accord utilisateur (ci-après – "Accord") régit la relation entre l'administration du site web (ci-après – "Administration") et l'utilisateur du site web (ci-après – "Utilisateur") lors de l'utilisation du site web.

## 2. Objet de l'accord

2.1. L'Administration accorde à l'Utilisateur le droit d'utiliser le site web selon les conditions énoncées dans le présent Accord.

2.2. L'utilisation du site web par l'Utilisateur signifie l'acceptation complète et inconditionnelle des conditions du présent Accord.

## 3. Droits et obligations des parties

3.1. L'Utilisateur s'engage à:
- Utiliser le site web conformément à sa destination
- Ne pas violer les droits de tiers
- Respecter les exigences légales

3.2. L'Administration s'engage à:
- Assurer le fonctionnement du site web
- Protéger les données personnelles de l'Utilisateur
- Fournir des informations à jour

## 4. Responsabilité

4.1. L'Administration n'est pas responsable des actions de l'Utilisateur lors de l'utilisation du site web.

4.2. L'Utilisateur est entièrement responsable de ses actions sur le site web.

## 5. Dispositions finales

5.1. Le présent Accord peut être modifié par l'Administration à tout moment.

5.2. Tous les litiges sont résolus par des négociations, et s'il est impossible d'atteindre un accord – par des procédures judiciaires.

Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}`,
      es: `# Acuerdo de usuario

## 1. Disposiciones generales

El presente Acuerdo de usuario (en adelante – "Acuerdo") rige la relación entre la administración del sitio web (en adelante – "Administración") y el usuario del sitio web (en adelante – "Usuario") al utilizar el sitio web.

## 2. Objeto del acuerdo

2.1. La Administración otorga al Usuario el derecho de utilizar el sitio web bajo los términos establecidos en el presente Acuerdo.

2.2. El uso del sitio web por parte del Usuario significa la aceptación completa e incondicional de los términos del presente Acuerdo.

## 3. Derechos y obligaciones de las partes

3.1. El Usuario se compromete a:
- Utilizar el sitio web de acuerdo con su propósito
- No violar los derechos de terceros
- Cumplir con los requisitos legales

3.2. La Administración se compromete a:
- Asegurar la funcionalidad del sitio web
- Proteger los datos personales del Usuario
- Proporcionar información actualizada

## 4. Responsabilidad

4.1. La Administración no es responsable de las acciones del Usuario al utilizar el sitio web.

4.2. El Usuario es completamente responsable de sus acciones en el sitio web.

## 5. Disposiciones finales

5.1. El presente Acuerdo puede ser modificado por la Administración en cualquier momento.

5.2. Todas las disputas se resuelven mediante negociaciones, y si es imposible llegar a un acuerdo – mediante procedimientos legales.

Última actualización: ${new Date().toLocaleDateString('es-ES')}`,
      ua: `# Пользовательское соглашение

## 1. Общие положения

Настоящее Пользовательское соглашение (далее – «Соглашение») регулирует отношения между администрацией сайта (далее – «Администрация») и пользователем сайта (далее – «Пользователь») при использовании сайта.

## 2. Предмет соглашения

2.1. Администрация предоставляет Пользователю право на использование сайта на условиях, изложенных в настоящем Соглашении.

2.2. Использование сайта Пользователем означает полное и безоговорочное принятие условий настоящего Соглашения.

## 3. Права и обязанности сторон

3.1. Пользователь обязуется:
- Использовать сайт в соответствии с его назначением
- Не нарушать права третьих лиц
- Соблюдать требования законодательства

3.2. Администрация обязуется:
- Обеспечивать работоспособность сайта
- Защищать персональные данные Пользователя
- Предоставлять актуальную информацию

## 4. Ответственность

4.1. Администрация не несет ответственности за действия Пользователя при использовании сайта.

4.2. Пользователь несет полную ответственность за свои действия на сайте.

## 5. Заключительные положения

5.1. Настоящее Соглашение может быть изменено Администрацией в любое время.

5.2. Все споры решаются путем переговоров, а при невозможности достижения согласия – в судебном порядке.

Дата последнего обновления: ${new Date().toLocaleDateString('ru-RU')}`,
    },
    seoTitle: {
      en: 'User Agreement',
      de: 'Nutzungsbedingungen',
      fr: 'Accord utilisateur',
      es: 'Acuerdo de usuario',
      ua: 'Угода користувача',
    },
    seoDescription: {
      en: 'Website user agreement. Terms of use and user rights.',
      de: 'Website-Nutzungsbedingungen. Nutzungsbedingungen und Benutzerrechte.',
      fr: 'Accord utilisateur du site web. Conditions d\'utilisation et droits des utilisateurs.',
      es: 'Acuerdo de usuario del sitio web. Términos de uso y derechos del usuario.',
      ua: 'Пользовательское соглашение сайта. Условия использования и права пользователей.',
    },
    seoKeywords: {
      en: 'user agreement, terms of use, website rules',
      de: 'Nutzungsbedingungen, Nutzungsbedingungen, Website-Regeln',
      fr: 'accord utilisateur, conditions d\'utilisation, règles du site web',
      es: 'acuerdo de usuario, términos de uso, reglas del sitio web',
      ua: 'пользовательское соглашение, условия использования, правила сайта',
    },
    order: 1,
  },
  {
    title: {
      en: 'Privacy Policy',
      de: 'Datenschutzrichtlinie',
      fr: 'Politique de confidentialité',
      es: 'Política de privacidad',
      ua: 'Политика конфиденциальности',
    },
    slug: 'privacy-policy',
    content: {
      en: `# Privacy Policy

## 1. General Provisions

This Privacy Policy (hereinafter – "Policy") defines the procedure for processing and protecting personal data of website users (hereinafter – "Users").

## 2. Collection of Personal Data

2.1. We collect the following categories of personal data:
- Name and contact information
- Delivery data
- Order information
- Technical data (IP address, cookies)

2.2. Personal data is collected only with the User's consent.

## 3. Use of Personal Data

3.1. Personal data is used for:
- Processing and fulfilling orders
- Communication with the User
- Improving service quality
- Informing about new offers

## 4. Protection of Personal Data

4.1. We apply technical and organizational measures to protect personal data from unauthorized access.

4.2. Personal data is not transferred to third parties without the User's consent, except in cases provided by law.

## 5. User Rights

5.1. The User has the right to:
- Receive information about their personal data
- Request correction of inaccurate data
- Request deletion of personal data
- Withdraw consent to data processing

## 6. Cookies

6.1. The website uses cookies to improve functionality and personalize content.

6.2. The User can configure the browser to refuse cookies, however, this may affect the website's functionality.

Last updated: ${new Date().toLocaleDateString('en-US')}`,
      de: `# Datenschutzrichtlinie

## 1. Allgemeine Bestimmungen

Diese Datenschutzrichtlinie (nachfolgend – "Richtlinie") definiert das Verfahren zur Verarbeitung und zum Schutz personenbezogener Daten von Website-Benutzern (nachfolgend – "Benutzer").

## 2. Sammlung personenbezogener Daten

2.1. Wir sammeln die folgenden Kategorien personenbezogener Daten:
- Name und Kontaktinformationen
- Lieferdaten
- Bestellinformationen
- Technische Daten (IP-Adresse, Cookies)

2.2. Personenbezogene Daten werden nur mit Zustimmung des Benutzers gesammelt.

## 3. Verwendung personenbezogener Daten

3.1. Personenbezogene Daten werden verwendet für:
- Verarbeitung und Erfüllung von Bestellungen
- Kommunikation mit dem Benutzer
- Verbesserung der Servicequalität
- Information über neue Angebote

## 4. Schutz personenbezogener Daten

4.1. Wir wenden technische und organisatorische Maßnahmen an, um personenbezogene Daten vor unbefugtem Zugriff zu schützen.

4.2. Personenbezogene Daten werden ohne Zustimmung des Benutzers nicht an Dritte weitergegeben, außer in gesetzlich vorgesehenen Fällen.

## 5. Benutzerrechte

5.1. Der Benutzer hat das Recht:
- Informationen über seine personenbezogenen Daten zu erhalten
- Korrektur ungenauer Daten zu verlangen
- Löschung personenbezogener Daten zu verlangen
- Zustimmung zur Datenverarbeitung zu widerrufen

## 6. Cookies

6.1. Die Website verwendet Cookies, um die Funktionalität zu verbessern und Inhalte zu personalisieren.

6.2. Der Benutzer kann den Browser so konfigurieren, dass Cookies abgelehnt werden, dies kann jedoch die Funktionalität der Website beeinträchtigen.

Zuletzt aktualisiert: ${new Date().toLocaleDateString('de-DE')}`,
      fr: `# Politique de confidentialité

## 1. Dispositions générales

La présente Politique de confidentialité (ci-après – "Politique") définit la procédure de traitement et de protection des données personnelles des utilisateurs du site web (ci-après – "Utilisateurs").

## 2. Collecte de données personnelles

2.1. Nous collectons les catégories suivantes de données personnelles:
- Nom et informations de contact
- Données de livraison
- Informations sur les commandes
- Données techniques (adresse IP, cookies)

2.2. Les données personnelles sont collectées uniquement avec le consentement de l'Utilisateur.

## 3. Utilisation des données personnelles

3.1. Les données personnelles sont utilisées pour:
- Traiter et exécuter les commandes
- Communiquer avec l'Utilisateur
- Améliorer la qualité du service
- Informer sur les nouvelles offres

## 4. Protection des données personnelles

4.1. Nous appliquons des mesures techniques et organisationnelles pour protéger les données personnelles contre l'accès non autorisé.

4.2. Les données personnelles ne sont pas transférées à des tiers sans le consentement de l'Utilisateur, sauf dans les cas prévus par la loi.

## 5. Droits de l'Utilisateur

5.1. L'Utilisateur a le droit de:
- Recevoir des informations sur ses données personnelles
- Demander la correction de données inexactes
- Demander la suppression de données personnelles
- Retirer le consentement au traitement des données

## 6. Cookies

6.1. Le site web utilise des cookies pour améliorer la fonctionnalité et personnaliser le contenu.

6.2. L'Utilisateur peut configurer le navigateur pour refuser les cookies, cependant, cela peut affecter la fonctionnalité du site web.

Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}`,
      es: `# Política de privacidad

## 1. Disposiciones generales

La presente Política de privacidad (en adelante – "Política") define el procedimiento para el procesamiento y la protección de datos personales de los usuarios del sitio web (en adelante – "Usuarios").

## 2. Recopilación de datos personales

2.1. Recopilamos las siguientes categorías de datos personales:
- Nombre e información de contacto
- Datos de entrega
- Información de pedidos
- Datos técnicos (dirección IP, cookies)

2.2. Los datos personales se recopilan solo con el consentimiento del Usuario.

## 3. Uso de datos personales

3.1. Los datos personales se utilizan para:
- Procesar y cumplir pedidos
- Comunicarse con el Usuario
- Mejorar la calidad del servicio
- Informar sobre nuevas ofertas

## 4. Protección de datos personales

4.1. Aplicamos medidas técnicas y organizativas para proteger los datos personales del acceso no autorizado.

4.2. Los datos personales no se transfieren a terceros sin el consentimiento del Usuario, excepto en los casos previstos por la ley.

## 5. Derechos del Usuario

5.1. El Usuario tiene derecho a:
- Recibir información sobre sus datos personales
- Solicitar la corrección de datos inexactos
- Solicitar la eliminación de datos personales
- Retirar el consentimiento para el procesamiento de datos

## 6. Cookies

6.1. El sitio web utiliza cookies para mejorar la funcionalidad y personalizar el contenido.

6.2. El Usuario puede configurar el navegador para rechazar las cookies, sin embargo, esto puede afectar la funcionalidad del sitio web.

Última actualización: ${new Date().toLocaleDateString('es-ES')}`,
      ua: `# Политика конфиденциальности

## 1. Общие положения

Настоящая Политика конфиденциальности (далее – «Политика») определяет порядок обработки и защиты персональных данных пользователей сайта (далее – «Пользователи»).

## 2. Сбор персональных данных

2.1. Мы собираем следующие категории персональных данных:
- Имя и контактная информация
- Данные для доставки
- Информация о заказах
- Технические данные (IP-адрес, cookies)

2.2. Персональные данные собираются только с согласия Пользователя.

## 3. Использование персональных данных

3.1. Персональные данные используются для:
- Обработки и выполнения заказов
- Связи с Пользователем
- Улучшения качества обслуживания
- Информирования о новых предложениях

## 4. Защита персональных данных

4.1. Мы применяем технические и организационные меры для защиты персональных данных от несанкционированного доступа.

4.2. Персональные данные не передаются третьим лицам без согласия Пользователя, за исключением случаев, предусмотренных законодательством.

## 5. Права Пользователя

5.1. Пользователь имеет право:
- Получать информацию о своих персональных данных
- Требовать исправления неточных данных
- Требовать удаления персональных данных
- Отозвать согласие на обработку данных

## 6. Cookies

6.1. Сайт использует cookies для улучшения работы и персонализации контента.

6.2. Пользователь может настроить браузер для отказа от cookies, однако это может повлиять на функциональность сайта.

Дата последнего обновления: ${new Date().toLocaleDateString('ru-RU')}`,
    },
    seoTitle: {
      en: 'Privacy Policy',
      de: 'Datenschutzrichtlinie',
      fr: 'Politique de confidentialité',
      es: 'Política de privacidad',
      ua: 'Политика конфиденциальности',
    },
    seoDescription: {
      en: 'Website privacy policy. Protection of users\' personal data.',
      de: 'Datenschutzrichtlinie der Website. Schutz personenbezogener Daten der Benutzer.',
      fr: 'Politique de confidentialité du site web. Protection des données personnelles des utilisateurs.',
      es: 'Política de privacidad del sitio web. Protección de datos personales de los usuarios.',
      ua: 'Политика конфиденциальности сайта. Защита персональных данных пользователей.',
    },
    seoKeywords: {
      en: 'privacy policy, data protection, personal data',
      de: 'Datenschutzrichtlinie, Datenschutz, personenbezogene Daten',
      fr: 'politique de confidentialité, protection des données, données personnelles',
      es: 'política de privacidad, protección de datos, datos personales',
      ua: 'политика конфиденциальности, защита данных, персональные данные',
    },
    order: 2,
  },
  {
    title: {
      en: 'Cookie Notice',
      de: 'Cookie-Hinweis',
      fr: 'Avis sur les cookies',
      es: 'Aviso de cookies',
      ua: 'Уведомление о cookie',
    },
    slug: 'cookie-notice',
    content: {
      en: `# Cookie Notice

## 1. What are cookies

Cookies are small text files that are saved on your device when you visit a website. They help the website remember your preferences and improve the website's functionality.

## 2. Types of cookies used

2.1. **Necessary cookies**
These cookies are necessary for the website to function and cannot be disabled. They are usually set in response to your actions, such as logging in or filling out forms.

2.2. **Functional cookies**
These cookies allow the website to remember your preferences (e.g., language, region) and provide enhanced features.

2.3. **Analytical cookies**
These cookies help us understand how visitors interact with the website by collecting and reporting information anonymously.

2.4. **Advertising cookies**
These cookies are used to track visitors across different websites in order to display relevant advertising.

## 3. Cookie management

3.1. You can manage cookie settings through your browser settings.

3.2. Please note that disabling some cookies may affect the website's functionality.

## 4. Third-party cookies

4.1. Our website may use third-party services that also set cookies on your device.

4.2. We do not control the use of cookies by third-party services.

## 5. Consent

5.1. By continuing to use our website, you agree to the use of cookies in accordance with this notice.

5.2. You can change your cookie preferences at any time.

Last updated: ${new Date().toLocaleDateString('en-US')}`,
      de: `# Cookie-Hinweis

## 1. Was sind Cookies

Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie eine Website besuchen. Sie helfen der Website, Ihre Präferenzen zu speichern und verbessern die Funktionalität der Website.

## 2. Arten von verwendeten Cookies

2.1. **Notwendige Cookies**
Diese Cookies sind für die Funktionsweise der Website erforderlich und können nicht deaktiviert werden. Sie werden normalerweise als Reaktion auf Ihre Aktionen gesetzt, wie z.B. beim Anmelden oder Ausfüllen von Formularen.

2.2. **Funktionale Cookies**
Diese Cookies ermöglichen es der Website, Ihre Präferenzen (z.B. Sprache, Region) zu speichern und erweiterte Funktionen bereitzustellen.

2.3. **Analytische Cookies**
Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, indem sie Informationen anonym sammeln und melden.

2.4. **Werbe-Cookies**
Diese Cookies werden verwendet, um Besucher auf verschiedenen Websites zu verfolgen, um relevante Werbung anzuzeigen.

## 3. Cookie-Verwaltung

3.1. Sie können Cookie-Einstellungen über Ihre Browser-Einstellungen verwalten.

3.2. Bitte beachten Sie, dass das Deaktivieren einiger Cookies die Funktionalität der Website beeinträchtigen kann.

## 4. Cookies von Drittanbietern

4.1. Unsere Website kann Drittanbieter-Dienste verwenden, die auch Cookies auf Ihrem Gerät setzen.

4.2. Wir kontrollieren nicht die Verwendung von Cookies durch Drittanbieter-Dienste.

## 5. Zustimmung

5.1. Durch die weitere Nutzung unserer Website stimmen Sie der Verwendung von Cookies gemäß diesem Hinweis zu.

5.2. Sie können Ihre Cookie-Präferenzen jederzeit ändern.

Zuletzt aktualisiert: ${new Date().toLocaleDateString('de-DE')}`,
      fr: `# Avis sur les cookies

## 1. Qu'est-ce que les cookies

Les cookies sont de petits fichiers texte qui sont enregistrés sur votre appareil lorsque vous visitez un site web. Ils aident le site web à mémoriser vos préférences et améliorent la fonctionnalité du site web.

## 2. Types de cookies utilisés

2.1. **Cookies nécessaires**
Ces cookies sont nécessaires au fonctionnement du site web et ne peuvent pas être désactivés. Ils sont généralement définis en réponse à vos actions, telles que la connexion ou le remplissage de formulaires.

2.2. **Cookies fonctionnels**
Ces cookies permettent au site web de mémoriser vos préférences (par exemple, langue, région) et de fournir des fonctionnalités améliorées.

2.3. **Cookies analytiques**
Ces cookies nous aident à comprendre comment les visiteurs interagissent avec le site web en collectant et en rapportant des informations de manière anonyme.

2.4. **Cookies publicitaires**
Ces cookies sont utilisés pour suivre les visiteurs sur différents sites web afin d'afficher des publicités pertinentes.

## 3. Gestion des cookies

3.1. Vous pouvez gérer les paramètres des cookies via les paramètres de votre navigateur.

3.2. Veuillez noter que la désactivation de certains cookies peut affecter la fonctionnalité du site web.

## 4. Cookies tiers

4.1. Notre site web peut utiliser des services tiers qui définissent également des cookies sur votre appareil.

4.2. Nous ne contrôlons pas l'utilisation des cookies par les services tiers.

## 5. Consentement

5.1. En continuant à utiliser notre site web, vous acceptez l'utilisation des cookies conformément à cet avis.

5.2. Vous pouvez modifier vos préférences de cookies à tout moment.

Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}`,
      es: `# Aviso de cookies

## 1. Qué son las cookies

Las cookies son pequeños archivos de texto que se guardan en su dispositivo cuando visita un sitio web. Ayudan al sitio web a recordar sus preferencias y mejoran la funcionalidad del sitio web.

## 2. Tipos de cookies utilizadas

2.1. **Cookies necesarias**
Estas cookies son necesarias para el funcionamiento del sitio web y no se pueden desactivar. Generalmente se establecen en respuesta a sus acciones, como iniciar sesión o completar formularios.

2.2. **Cookies funcionales**
Estas cookies permiten que el sitio web recuerde sus preferencias (por ejemplo, idioma, región) y proporcione funciones mejoradas.

2.3. **Cookies analíticas**
Estas cookies nos ayudan a entender cómo los visitantes interactúan con el sitio web recopilando e informando información de forma anónima.

2.4. **Cookies publicitarias**
Estas cookies se utilizan para rastrear a los visitantes en diferentes sitios web con el fin de mostrar publicidad relevante.

## 3. Gestión de cookies

3.1. Puede gestionar la configuración de cookies a través de la configuración de su navegador.

3.2. Tenga en cuenta que desactivar algunas cookies puede afectar la funcionalidad del sitio web.

## 4. Cookies de terceros

4.1. Nuestro sitio web puede utilizar servicios de terceros que también establecen cookies en su dispositivo.

4.2. No controlamos el uso de cookies por parte de los servicios de terceros.

## 5. Consentimiento

5.1. Al continuar utilizando nuestro sitio web, acepta el uso de cookies de acuerdo con este aviso.

5.2. Puede cambiar sus preferencias de cookies en cualquier momento.

Última actualización: ${new Date().toLocaleDateString('es-ES')}`,
      ua: `# Уведомление о cookie

## 1. Что такое cookies

Cookies – это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении веб-сайта. Они помогают сайту запоминать ваши предпочтения и улучшают работу сайта.

## 2. Типы используемых cookies

2.1. **Необходимые cookies**
Эти cookies необходимы для работы сайта и не могут быть отключены. Они обычно устанавливаются в ответ на ваши действия, такие как вход в систему или заполнение форм.

2.2. **Функциональные cookies**
Эти cookies позволяют сайту запоминать ваши предпочтения (например, язык, регион) и предоставлять улучшенные функции.

2.3. **Аналитические cookies**
Эти cookies помогают нам понять, как посетители взаимодействуют с сайтом, собирая и сообщая информацию анонимно.

2.4. **Рекламные cookies**
Эти cookies используются для отслеживания посетителей на разных сайтах с целью показа релевантной рекламы.

## 3. Управление cookies

3.1. Вы можете управлять настройками cookies через настройки вашего браузера.

3.2. Обратите внимание, что отключение некоторых cookies может повлиять на функциональность сайта.

## 4. Сторонние cookies

4.1. Наш сайт может использовать сторонние сервисы, которые также устанавливают cookies на ваше устройство.

4.2. Мы не контролируем использование cookies сторонними сервисами.

## 5. Согласие

5.1. Продолжая использовать наш сайт, вы соглашаетесь с использованием cookies в соответствии с настоящим уведомлением.

5.2. Вы можете в любой момент изменить свои предпочтения относительно cookies.

Дата последнего обновления: ${new Date().toLocaleDateString('ru-RU')}`,
    },
    seoTitle: {
      en: 'Cookie Notice',
      de: 'Cookie-Hinweis',
      fr: 'Avis sur les cookies',
      es: 'Aviso de cookies',
      ua: 'Уведомление о cookie',
    },
    seoDescription: {
      en: 'Information about the use of cookies on the website. Types of cookies and cookie management.',
      de: 'Informationen über die Verwendung von Cookies auf der Website. Arten von Cookies und Cookie-Verwaltung.',
      fr: 'Informations sur l\'utilisation des cookies sur le site web. Types de cookies et gestion des cookies.',
      es: 'Información sobre el uso de cookies en el sitio web. Tipos de cookies y gestión de cookies.',
      ua: 'Информация об использовании cookies на сайте. Типы cookies и управление настройками.',
    },
    seoKeywords: {
      en: 'cookies, cookie settings, cookie management',
      de: 'Cookies, Cookie-Einstellungen, Cookie-Verwaltung',
      fr: 'cookies, paramètres de cookies, gestion des cookies',
      es: 'cookies, configuración de cookies, gestión de cookies',
      ua: 'cookies, куки, настройки cookies, управление cookies',
    },
    order: 3,
  },
  {
    title: {
      en: 'Shipping',
      de: 'Versand',
      fr: 'Livraison',
      es: 'Envío',
      ua: 'Доставка',
    },
    slug: 'shipping',
    content: {
      en: `# Shipping Policy

## 1. Delivery Areas

We provide delivery services to customers within our service area. Delivery is available to the following regions:
- Berlin and surrounding areas
- Other regions may be available upon request

## 2. Delivery Methods

2.1. **Standard Delivery**
- Delivery time: 1-3 business days
- Delivery cost: Calculated based on order total and distance
- Free shipping available for orders over a certain amount

2.2. **Express Delivery**
- Delivery time: Same day or next day (subject to availability)
- Additional charges apply
- Available for orders placed before 2:00 PM

2.3. **Pickup**
- Free pickup available from our warehouse
- Operating hours: Monday - Friday, 9:00 AM - 6:00 PM
- Address: Unter den Linden 1, 10117 Berlin, Germany

## 3. Delivery Costs

3.1. Standard delivery costs are calculated based on:
- Order total
- Delivery distance
- Package weight and dimensions

3.2. Free shipping is available for orders exceeding the minimum order value (check current promotions).

3.3. Express delivery incurs additional charges, which will be shown during checkout.

## 4. Delivery Time

4.1. Standard delivery: 1-3 business days from order confirmation.

4.2. Express delivery: Same day or next business day (for orders placed before 2:00 PM).

4.3. Delivery times are estimates and may vary due to:
- Weather conditions
- High order volumes
- Public holidays
- Remote delivery locations

## 5. Order Tracking

5.1. Once your order is shipped, you will receive a tracking number via email or SMS.

5.2. You can track your order status in your account or by contacting our customer service.

## 6. Delivery Requirements

6.1. Please ensure someone is available to receive the delivery at the specified address.

6.2. Valid identification may be required upon delivery.

6.3. If delivery cannot be completed due to recipient unavailability, additional delivery attempts may incur extra charges.

## 7. Damaged or Lost Packages

7.1. Please inspect your package upon delivery. If you notice any damage, please contact us immediately.

7.2. We are not responsible for packages lost due to incorrect address information provided by the customer.

7.3. In case of lost or damaged packages, please contact our customer service within 48 hours of expected delivery date.

## 8. International Shipping

8.1. International shipping is available to select countries. Please contact us for more information.

8.2. International orders may be subject to customs duties and taxes, which are the responsibility of the recipient.

Last updated: ${new Date().toLocaleDateString('en-US')}`,
      de: `# Versandrichtlinie

## 1. Liefergebiete

Wir bieten Lieferdienste für Kunden in unserem Servicegebiet an. Die Lieferung ist in den folgenden Regionen verfügbar:
- Berlin und Umgebung
- Andere Regionen können auf Anfrage verfügbar sein

## 2. Liefermethoden

2.1. **Standardlieferung**
- Lieferzeit: 1-3 Werktage
- Lieferkosten: Berechnet basierend auf Bestellsumme und Entfernung
- Kostenloser Versand verfügbar für Bestellungen über einen bestimmten Betrag

2.2. **Express-Lieferung**
- Lieferzeit: Am selben Tag oder am nächsten Tag (je nach Verfügbarkeit)
- Zusätzliche Gebühren fallen an
- Verfügbar für Bestellungen, die vor 14:00 Uhr aufgegeben wurden

2.3. **Abholung**
- Kostenlose Abholung verfügbar von unserem Lager
- Öffnungszeiten: Montag - Freitag, 9:00 - 18:00 Uhr
- Adresse: Unter den Linden 1, 10117 Berlin, Deutschland

## 3. Lieferkosten

3.1. Die Standardlieferkosten werden basierend auf berechnet:
- Bestellsumme
- Lieferentfernung
- Paketgewicht und -abmessungen

3.2. Kostenloser Versand ist verfügbar für Bestellungen, die den Mindestbestellwert überschreiten (prüfen Sie aktuelle Aktionen).

3.3. Express-Lieferung verursacht zusätzliche Gebühren, die während des Checkouts angezeigt werden.

## 4. Lieferzeit

4.1. Standardlieferung: 1-3 Werktage ab Bestellbestätigung.

4.2. Express-Lieferung: Am selben Tag oder am nächsten Werktag (für Bestellungen, die vor 14:00 Uhr aufgegeben wurden).

4.3. Lieferzeiten sind Schätzungen und können variieren aufgrund von:
- Wetterbedingungen
- Hohem Bestellvolumen
- Feiertagen
- Abgelegenen Lieferorten

## 5. Bestellverfolgung

4.1. Sobald Ihre Bestellung versandt wurde, erhalten Sie eine Tracking-Nummer per E-Mail oder SMS.

4.2. Sie können den Status Ihrer Bestellung in Ihrem Konto oder durch Kontaktaufnahme mit unserem Kundenservice verfolgen.

## 6. Lieferanforderungen

6.1. Bitte stellen Sie sicher, dass jemand verfügbar ist, um die Lieferung an der angegebenen Adresse zu empfangen.

6.2. Bei der Lieferung kann ein gültiger Ausweis erforderlich sein.

6.3. Wenn die Lieferung aufgrund der Nichtverfügbarkeit des Empfängers nicht abgeschlossen werden kann, können zusätzliche Lieferversuche zusätzliche Gebühren verursachen.

## 7. Beschädigte oder verlorene Pakete

7.1. Bitte überprüfen Sie Ihr Paket bei der Lieferung. Wenn Sie Schäden bemerken, kontaktieren Sie uns bitte sofort.

7.2. Wir sind nicht verantwortlich für Pakete, die aufgrund falscher Adressinformationen des Kunden verloren gehen.

7.3. Im Falle von verlorenen oder beschädigten Paketen kontaktieren Sie bitte unseren Kundenservice innerhalb von 48 Stunden nach dem erwarteten Lieferdatum.

## 8. Internationaler Versand

8.1. Internationaler Versand ist in ausgewählte Länder verfügbar. Bitte kontaktieren Sie uns für weitere Informationen.

8.2. Internationale Bestellungen können Zollgebühren und Steuern unterliegen, die in der Verantwortung des Empfängers liegen.

Zuletzt aktualisiert: ${new Date().toLocaleDateString('de-DE')}`,
      fr: `# Politique d'expédition

## 1. Zones de livraison

Nous fournissons des services de livraison aux clients dans notre zone de service. La livraison est disponible dans les régions suivantes:
- Berlin et les environs
- D'autres régions peuvent être disponibles sur demande

## 2. Méthodes de livraison

2.1. **Livraison standard**
- Délai de livraison: 1-3 jours ouvrables
- Coût de livraison: Calculé en fonction du montant de la commande et de la distance
- Livraison gratuite disponible pour les commandes supérieures à un certain montant

2.2. **Livraison express**
- Délai de livraison: Le jour même ou le lendemain (sous réserve de disponibilité)
- Des frais supplémentaires s'appliquent
- Disponible pour les commandes passées avant 14h00

2.3. **Retrait**
- Retrait gratuit disponible depuis notre entrepôt
- Heures d'ouverture: Lundi - Vendredi, 9h00 - 18h00
- Adresse: Unter den Linden 1, 10117 Berlin, Allemagne

## 3. Coûts de livraison

3.1. Les coûts de livraison standard sont calculés en fonction de:
- Le montant total de la commande
- La distance de livraison
- Le poids et les dimensions du colis

3.2. La livraison gratuite est disponible pour les commandes dépassant la valeur minimale de commande (vérifiez les promotions actuelles).

3.3. La livraison express entraîne des frais supplémentaires, qui seront affichés lors du paiement.

## 4. Délai de livraison

4.1. Livraison standard: 1-3 jours ouvrables à partir de la confirmation de commande.

4.2. Livraison express: Le jour même ou le jour ouvrable suivant (pour les commandes passées avant 14h00).

4.3. Les délais de livraison sont des estimations et peuvent varier en raison de:
- Conditions météorologiques
- Volume élevé de commandes
- Jours fériés
- Emplacements de livraison éloignés

## 5. Suivi de commande

5.1. Une fois votre commande expédiée, vous recevrez un numéro de suivi par e-mail ou SMS.

5.2. Vous pouvez suivre le statut de votre commande dans votre compte ou en contactant notre service client.

## 6. Exigences de livraison

6.1. Veuillez vous assurer que quelqu'un est disponible pour recevoir la livraison à l'adresse spécifiée.

6.2. Une pièce d'identité valide peut être requise lors de la livraison.

6.3. Si la livraison ne peut pas être complétée en raison de l'indisponibilité du destinataire, des tentatives de livraison supplémentaires peuvent entraîner des frais supplémentaires.

## 7. Colis endommagés ou perdus

7.1. Veuillez inspecter votre colis à la livraison. Si vous remarquez des dommages, veuillez nous contacter immédiatement.

7.2. Nous ne sommes pas responsables des colis perdus en raison d'informations d'adresse incorrectes fournies par le client.

7.3. En cas de colis perdus ou endommagés, veuillez contacter notre service client dans les 48 heures suivant la date de livraison prévue.

## 8. Expédition internationale

8.1. L'expédition internationale est disponible vers certains pays. Veuillez nous contacter pour plus d'informations.

8.2. Les commandes internationales peuvent être soumises à des droits de douane et taxes, qui sont à la charge du destinataire.

Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}`,
      es: `# Política de envío

## 1. Áreas de entrega

Proporcionamos servicios de entrega a clientes dentro de nuestra área de servicio. La entrega está disponible en las siguientes regiones:
- Berlín y áreas circundantes
- Otras regiones pueden estar disponibles bajo solicitud

## 2. Métodos de entrega

2.1. **Entrega estándar**
- Tiempo de entrega: 1-3 días hábiles
- Costo de entrega: Calculado según el total del pedido y la distancia
- Envío gratuito disponible para pedidos superiores a una cantidad determinada

2.2. **Entrega express**
- Tiempo de entrega: El mismo día o al día siguiente (sujeto a disponibilidad)
- Se aplican cargos adicionales
- Disponible para pedidos realizados antes de las 2:00 PM

2.3. **Recogida**
- Recogida gratuita disponible desde nuestro almacén
- Horario de atención: Lunes - Viernes, 9:00 AM - 6:00 PM
- Dirección: Unter den Linden 1, 10117 Berlín, Alemania

## 3. Costos de entrega

3.1. Los costos de entrega estándar se calculan en función de:
- Total del pedido
- Distancia de entrega
- Peso y dimensiones del paquete

3.2. El envío gratuito está disponible para pedidos que excedan el valor mínimo del pedido (consulte las promociones actuales).

3.3. La entrega express incurre en cargos adicionales, que se mostrarán durante el pago.

## 4. Tiempo de entrega

4.1. Entrega estándar: 1-3 días hábiles desde la confirmación del pedido.

4.2. Entrega express: El mismo día o el día hábil siguiente (para pedidos realizados antes de las 2:00 PM).

4.3. Los tiempos de entrega son estimaciones y pueden variar debido a:
- Condiciones climáticas
- Alto volumen de pedidos
- Días festivos
- Ubicaciones de entrega remotas

## 5. Seguimiento de pedidos

5.1. Una vez que su pedido sea enviado, recibirá un número de seguimiento por correo electrónico o SMS.

5.2. Puede rastrear el estado de su pedido en su cuenta o contactando a nuestro servicio al cliente.

## 6. Requisitos de entrega

6.1. Por favor, asegúrese de que alguien esté disponible para recibir la entrega en la dirección especificada.

6.2. Se puede requerir identificación válida al momento de la entrega.

6.3. Si la entrega no puede completarse debido a la indisponibilidad del destinatario, los intentos de entrega adicionales pueden incurrir en cargos adicionales.

## 7. Paquetes dañados o perdidos

7.1. Por favor, inspeccione su paquete al momento de la entrega. Si nota algún daño, contáctenos inmediatamente.

7.2. No somos responsables de paquetes perdidos debido a información de dirección incorrecta proporcionada por el cliente.

7.3. En caso de paquetes perdidos o dañados, por favor contacte a nuestro servicio al cliente dentro de las 48 horas de la fecha de entrega esperada.

## 8. Envío internacional

8.1. El envío internacional está disponible a países seleccionados. Por favor, contáctenos para más información.

8.2. Los pedidos internacionales pueden estar sujetos a derechos de aduana e impuestos, que son responsabilidad del destinatario.

Última actualización: ${new Date().toLocaleDateString('es-ES')}`,
      ua: `# Политика доставки

## 1. Зоны доставки

Мы предоставляем услуги доставки клиентам в пределах нашей зоны обслуживания. Доставка доступна в следующие регионы:
- Берлин и прилегающие районы
- Другие регионы могут быть доступны по запросу

## 2. Способы доставки

2.1. **Стандартная доставка**
- Срок доставки: 1-3 рабочих дня
- Стоимость доставки: Рассчитывается на основе суммы заказа и расстояния
- Бесплатная доставка доступна для заказов на определенную сумму

2.2. **Экспресс-доставка**
- Срок доставки: В день заказа или на следующий день (при наличии)
- Применяются дополнительные сборы
- Доступна для заказов, размещенных до 14:00

2.3. **Самовывоз**
- Бесплатный самовывоз доступен с нашего склада
- Часы работы: Понедельник - Пятница, 9:00 - 18:00
- Адрес: Unter den Linden 1, 10117 Берлин, Германия

## 3. Стоимость доставки

3.1. Стоимость стандартной доставки рассчитывается на основе:
- Суммы заказа
- Расстояния доставки
- Веса и габаритов посылки

3.2. Бесплатная доставка доступна для заказов, превышающих минимальную сумму заказа (проверьте текущие акции).

3.3. Экспресс-доставка влечет дополнительные расходы, которые будут показаны при оформлении заказа.

## 4. Сроки доставки

4.1. Стандартная доставка: 1-3 рабочих дня с момента подтверждения заказа.

4.2. Экспресс-доставка: В день заказа или на следующий рабочий день (для заказов, размещенных до 14:00).

4.3. Сроки доставки являются приблизительными и могут варьироваться в зависимости от:
- Погодных условий
- Высокого объема заказов
- Государственных праздников
- Удаленных мест доставки

## 5. Отслеживание заказа

5.1. После отправки вашего заказа вы получите номер отслеживания по электронной почте или SMS.

5.2. Вы можете отслеживать статус заказа в своем аккаунте или связавшись с нашей службой поддержки.

## 6. Требования к доставке

6.1. Пожалуйста, убедитесь, что кто-то будет доступен для получения доставки по указанному адресу.

6.2. При доставке может потребоваться удостоверение личности.

6.3. Если доставка не может быть завершена из-за недоступности получателя, дополнительные попытки доставки могут повлечь дополнительные расходы.

## 7. Поврежденные или утерянные посылки

7.1. Пожалуйста, проверьте вашу посылку при доставке. Если вы заметили какие-либо повреждения, немедленно свяжитесь с нами.

7.2. Мы не несем ответственности за посылки, утерянные из-за неправильной адресной информации, предоставленной клиентом.

7.3. В случае утери или повреждения посылок, пожалуйста, свяжитесь с нашей службой поддержки в течение 48 часов с даты ожидаемой доставки.

## 8. Международная доставка

8.1. Международная доставка доступна в выбранные страны. Пожалуйста, свяжитесь с нами для получения дополнительной информации.

8.2. Международные заказы могут облагаться таможенными пошлинами и налогами, которые являются ответственностью получателя.

Дата последнего обновления: ${new Date().toLocaleDateString('ru-RU')}`,
    },
    seoTitle: {
      en: 'Shipping Policy - Delivery Information',
      de: 'Versandrichtlinie - Lieferinformationen',
      fr: 'Politique d\'expédition - Informations sur la livraison',
      es: 'Política de envío - Información de entrega',
      ua: 'Политика доставки - Информация о доставке',
    },
    seoDescription: {
      en: 'Learn about our shipping options, delivery times, costs, and policies. Free shipping available for qualifying orders.',
      de: 'Erfahren Sie mehr über unsere Versandoptionen, Lieferzeiten, Kosten und Richtlinien. Kostenloser Versand für qualifizierte Bestellungen verfügbar.',
      fr: 'Découvrez nos options d\'expédition, délais de livraison, coûts et politiques. Livraison gratuite disponible pour les commandes éligibles.',
      es: 'Conozca nuestras opciones de envío, tiempos de entrega, costos y políticas. Envío gratuito disponible para pedidos calificados.',
      ua: 'Узнайте о наших вариантах доставки, сроках, стоимости и политике. Бесплатная доставка доступна для соответствующих заказов.',
    },
    seoKeywords: {
      en: 'shipping, delivery, shipping policy, free shipping, delivery time',
      de: 'Versand, Lieferung, Versandrichtlinie, kostenloser Versand, Lieferzeit',
      fr: 'expédition, livraison, politique d\'expédition, livraison gratuite, délai de livraison',
      es: 'envío, entrega, política de envío, envío gratuito, tiempo de entrega',
      ua: 'доставка, политика доставки, бесплатная доставка, сроки доставки',
    },
    order: 4,
  },
  {
    title: {
      en: 'Payment',
      de: 'Zahlung',
      fr: 'Paiement',
      es: 'Pago',
      ua: 'Оплата',
    },
    slug: 'payment',
    content: {
      en: `# Payment Policy

## 1. Accepted Payment Methods

We accept the following payment methods:

1.1. **Cash on Delivery**
- Pay with cash when you receive your order
- Available for all delivery orders
- Exact change is appreciated

1.2. **Card Payment to Courier**
- Pay with bank card when receiving your order
- We accept: VISA, Mastercard
- Card payment terminal is available with our courier

1.3. **Online Payment**
- Secure online payment via payment gateway
- Available during checkout
- All transactions are encrypted and secure

## 2. Payment Security

2.1. All online payments are processed through secure payment gateways.

2.2. We do not store your full credit card information on our servers.

2.3. All payment data is encrypted using industry-standard SSL encryption.

2.4. We comply with PCI DSS standards for payment card data security.

## 3. Payment Processing

3.1. For online payments, your payment will be processed immediately upon order confirmation.

3.2. For cash on delivery and card payment to courier, payment is collected at the time of delivery.

3.3. If payment cannot be processed, your order may be cancelled. We will notify you if this occurs.

## 4. Payment Confirmation

4.1. You will receive a payment confirmation via email after successful payment.

4.2. Payment confirmation includes:
- Order number
- Payment amount
- Payment method used
- Transaction reference number

## 5. Refunds

5.1. Refunds are processed according to our Returns Policy.

5.2. Refund processing time:
- Credit card refunds: 5-10 business days
- Bank transfer refunds: 3-5 business days

5.3. Refunds will be issued to the original payment method used for the order.

## 6. Currency

6.1. All prices are displayed in the currency of your region.

6.2. For international orders, prices may be converted to your local currency at checkout.

6.3. Exchange rates are determined by your payment provider and may vary.

## 7. Payment Issues

7.1. If you experience any payment issues, please contact our customer service immediately.

7.2. Common payment issues:
- Payment declined
- Double charges
- Payment not reflected in order status
- Refund not received

7.3. We will investigate and resolve payment issues within 2-3 business days.

## 8. Payment Terms

8.1. Payment must be completed before order processing begins (for online payments).

8.2. For cash on delivery orders, payment is due upon delivery.

8.3. We reserve the right to cancel orders if payment cannot be verified or processed.

Last updated: ${new Date().toLocaleDateString('en-US')}`,
      de: `# Zahlungsrichtlinie

## 1. Akzeptierte Zahlungsmethoden

Wir akzeptieren die folgenden Zahlungsmethoden:

1.1. **Nachnahme**
- Bezahlung mit Bargeld bei Erhalt Ihrer Bestellung
- Verfügbar für alle Bestellungen mit Lieferung
- Genauer Betrag wird geschätzt

1.2. **Kartenzahlung an den Kurier**
- Bezahlung mit Bankkarte bei Erhalt Ihrer Bestellung
- Wir akzeptieren: VISA, Mastercard
- Kartenzahlungsterminal ist bei unserem Kurier verfügbar

1.3. **Online-Zahlung**
- Sichere Online-Zahlung über Zahlungsgateway
- Verfügbar während des Checkouts
- Alle Transaktionen sind verschlüsselt und sicher

## 2. Zahlungssicherheit

2.1. Alle Online-Zahlungen werden über sichere Zahlungsgateways verarbeitet.

2.2. Wir speichern nicht Ihre vollständigen Kreditkarteninformationen auf unseren Servern.

2.3. Alle Zahlungsdaten werden mit branchenüblicher SSL-Verschlüsselung verschlüsselt.

2.4. Wir halten PCI DSS-Standards für die Sicherheit von Zahlungskartendaten ein.

## 3. Zahlungsverarbeitung

3.1. Für Online-Zahlungen wird Ihre Zahlung sofort nach Bestellbestätigung verarbeitet.

3.2. Für Nachnahme und Kartenzahlung an den Kurier wird die Zahlung zum Zeitpunkt der Lieferung erhoben.

3.3. Wenn die Zahlung nicht verarbeitet werden kann, kann Ihre Bestellung storniert werden. Wir werden Sie benachrichtigen, wenn dies geschieht.

## 4. Zahlungsbestätigung

4.1. Sie erhalten eine Zahlungsbestätigung per E-Mail nach erfolgreicher Zahlung.

4.2. Die Zahlungsbestätigung umfasst:
- Bestellnummer
- Zahlungsbetrag
- Verwendete Zahlungsmethode
- Transaktionsreferenznummer

## 5. Rückerstattungen

5.1. Rückerstattungen werden gemäß unserer Rückgaberichtlinie verarbeitet.

5.2. Rückerstattungsverarbeitungszeit:
- Kreditkartenrückerstattungen: 5-10 Werktage
- Banküberweisungsrückerstattungen: 3-5 Werktage

5.3. Rückerstattungen werden auf die ursprüngliche Zahlungsmethode ausgegeben, die für die Bestellung verwendet wurde.

## 6. Währung

6.1. Alle Preise werden in der Währung Ihrer Region angezeigt.

6.2. Für internationale Bestellungen können die Preise bei der Bestellung in Ihre lokale Währung umgerechnet werden.

6.3. Wechselkurse werden von Ihrem Zahlungsanbieter bestimmt und können variieren.

## 7. Zahlungsprobleme

7.1. Wenn Sie Zahlungsprobleme haben, kontaktieren Sie bitte sofort unseren Kundenservice.

7.2. Häufige Zahlungsprobleme:
- Zahlung abgelehnt
- Doppelte Belastung
- Zahlung nicht im Bestellstatus widergespiegelt
- Rückerstattung nicht erhalten

7.3. Wir werden Zahlungsprobleme innerhalb von 2-3 Werktagen untersuchen und lösen.

## 8. Zahlungsbedingungen

8.1. Die Zahlung muss vor Beginn der Bestellverarbeitung abgeschlossen sein (für Online-Zahlungen).

8.2. Für Nachnahmebestellungen ist die Zahlung bei der Lieferung fällig.

8.3. Wir behalten uns das Recht vor, Bestellungen zu stornieren, wenn die Zahlung nicht verifiziert oder verarbeitet werden kann.

Zuletzt aktualisiert: ${new Date().toLocaleDateString('de-DE')}`,
      fr: `# Politique de paiement

## 1. Méthodes de paiement acceptées

Nous acceptons les méthodes de paiement suivantes:

1.1. **Paiement à la livraison**
- Payer en espèces lors de la réception de votre commande
- Disponible pour toutes les commandes avec livraison
- Le montant exact est apprécié

1.2. **Paiement par carte au coursier**
- Payer par carte bancaire lors de la réception de votre commande
- Nous acceptons: VISA, Mastercard
- Le terminal de paiement par carte est disponible avec notre coursier

1.3. **Paiement en ligne**
- Paiement en ligne sécurisé via passerelle de paiement
- Disponible lors du paiement
- Toutes les transactions sont cryptées et sécurisées

## 2. Sécurité des paiements

2.1. Tous les paiements en ligne sont traités via des passerelles de paiement sécurisées.

2.2. Nous ne stockons pas les informations complètes de votre carte de crédit sur nos serveurs.

2.3. Toutes les données de paiement sont cryptées à l'aide du cryptage SSL standard de l'industrie.

2.4. Nous respectons les normes PCI DSS pour la sécurité des données des cartes de paiement.

## 3. Traitement des paiements

3.1. Pour les paiements en ligne, votre paiement sera traité immédiatement après la confirmation de la commande.

3.2. Pour le paiement à la livraison et le paiement par carte au coursier, le paiement est collecté au moment de la livraison.

3.3. Si le paiement ne peut pas être traité, votre commande peut être annulée. Nous vous en informerons si cela se produit.

## 4. Confirmation de paiement

4.1. Vous recevrez une confirmation de paiement par e-mail après un paiement réussi.

4.2. La confirmation de paiement comprend:
- Numéro de commande
- Montant du paiement
- Méthode de paiement utilisée
- Numéro de référence de transaction

## 5. Remboursements

5.1. Les remboursements sont traités conformément à notre politique de retour.

5.2. Délai de traitement du remboursement:
- Remboursements par carte de crédit: 5-10 jours ouvrables
- Remboursements par virement bancaire: 3-5 jours ouvrables

5.3. Les remboursements seront émis sur la méthode de paiement d'origine utilisée pour la commande.

## 6. Devise

6.1. Tous les prix sont affichés dans la devise de votre région.

6.2. Pour les commandes internationales, les prix peuvent être convertis dans votre devise locale lors du paiement.

6.3. Les taux de change sont déterminés par votre fournisseur de paiement et peuvent varier.

## 7. Problèmes de paiement

7.1. Si vous rencontrez des problèmes de paiement, veuillez contacter immédiatement notre service client.

7.2. Problèmes de paiement courants:
- Paiement refusé
- Double débit
- Paiement non reflété dans le statut de la commande
- Remboursement non reçu

7.3. Nous enquêterons et résoudrons les problèmes de paiement dans les 2-3 jours ouvrables.

## 8. Conditions de paiement

8.1. Le paiement doit être complété avant le début du traitement de la commande (pour les paiements en ligne).

8.2. Pour les commandes avec paiement à la livraison, le paiement est dû à la livraison.

8.3. Nous nous réservons le droit d'annuler les commandes si le paiement ne peut pas être vérifié ou traité.

Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}`,
      es: `# Política de pago

## 1. Métodos de pago aceptados

Aceptamos los siguientes métodos de pago:

1.1. **Pago contra reembolso**
- Pague en efectivo cuando reciba su pedido
- Disponible para todos los pedidos con entrega
- Se aprecia el cambio exacto

1.2. **Pago con tarjeta al mensajero**
- Pague con tarjeta bancaria al recibir su pedido
- Aceptamos: VISA, Mastercard
- El terminal de pago con tarjeta está disponible con nuestro mensajero

1.3. **Pago en línea**
- Pago en línea seguro a través de pasarela de pago
- Disponible durante el pago
- Todas las transacciones están encriptadas y seguras

## 2. Seguridad de pagos

2.1. Todos los pagos en línea se procesan a través de pasarelas de pago seguras.

2.2. No almacenamos la información completa de su tarjeta de crédito en nuestros servidores.

2.3. Todos los datos de pago se encriptan utilizando encriptación SSL estándar de la industria.

2.4. Cumplimos con los estándares PCI DSS para la seguridad de los datos de las tarjetas de pago.

## 3. Procesamiento de pagos

3.1. Para pagos en línea, su pago se procesará inmediatamente después de la confirmación del pedido.

3.2. Para pago contra reembolso y pago con tarjeta al mensajero, el pago se cobra en el momento de la entrega.

3.3. Si el pago no se puede procesar, su pedido puede ser cancelado. Le notificaremos si esto ocurre.

## 4. Confirmación de pago

4.1. Recibirá una confirmación de pago por correo electrónico después de un pago exitoso.

4.2. La confirmación de pago incluye:
- Número de pedido
- Monto del pago
- Método de pago utilizado
- Número de referencia de transacción

## 5. Reembolsos

5.1. Los reembolsos se procesan de acuerdo con nuestra política de devolución.

5.2. Tiempo de procesamiento del reembolso:
- Reembolsos a tarjeta de crédito: 5-10 días hábiles
- Reembolsos por transferencia bancaria: 3-5 días hábiles

5.3. Los reembolsos se emitirán al método de pago original utilizado para el pedido.

## 6. Moneda

6.1. Todos los precios se muestran en la moneda de su región.

6.2. Para pedidos internacionales, los precios pueden convertirse a su moneda local durante el pago.

6.3. Las tasas de cambio las determina su proveedor de pago y pueden variar.

## 7. Problemas de pago

7.1. Si experimenta problemas de pago, póngase en contacto inmediatamente con nuestro servicio al cliente.

7.2. Problemas de pago comunes:
- Pago rechazado
- Cargos dobles
- Pago no reflejado en el estado del pedido
- Reembolso no recibido

7.3. Investigaremos y resolveremos los problemas de pago en 2-3 días hábiles.

## 8. Términos de pago

8.1. El pago debe completarse antes de que comience el procesamiento del pedido (para pagos en línea).

8.2. Para pedidos con pago contra reembolso, el pago vence al momento de la entrega.

8.3. Nos reservamos el derecho de cancelar pedidos si el pago no se puede verificar o procesar.

Última actualización: ${new Date().toLocaleDateString('es-ES')}`,
      ua: `# Политика оплаты

## 1. Принимаемые способы оплаты

Мы принимаем следующие способы оплаты:

1.1. **Наличными при получении**
- Оплата наличными при получении заказа
- Доступна для всех заказов с доставкой
- Желательно иметь точную сумму

1.2. **Банковской картой курьеру**
- Оплата банковской картой при получении заказа
- Мы принимаем: VISA, Mastercard
- Терминал для оплаты картой доступен у нашего курьера

1.3. **Онлайн-оплата**
- Безопасная онлайн-оплата через платежный шлюз
- Доступна при оформлении заказа
- Все транзакции зашифрованы и безопасны

## 2. Безопасность платежей

2.1. Все онлайн-платежи обрабатываются через защищенные платежные шлюзы.

2.2. Мы не храним полную информацию о вашей кредитной карте на наших серверах.

2.3. Все платежные данные шифруются с использованием стандартного SSL-шифрования.

2.4. Мы соблюдаем стандарты PCI DSS для безопасности данных платежных карт.

## 3. Обработка платежей

3.1. Для онлайн-платежей ваш платеж будет обработан немедленно после подтверждения заказа.

3.2. Для оплаты наличными и картой курьеру оплата взимается во время доставки.

3.3. Если платеж не может быть обработан, ваш заказ может быть отменен. Мы уведомим вас, если это произойдет.

## 4. Подтверждение оплаты

4.1. Вы получите подтверждение оплаты по электронной почте после успешной оплаты.

4.2. Подтверждение оплаты включает:
- Номер заказа
- Сумму оплаты
- Использованный способ оплаты
- Референсный номер транзакции

## 5. Возвраты средств

5.1. Возвраты средств обрабатываются в соответствии с нашей Политикой возврата.

5.2. Время обработки возврата:
- Возврат на кредитную карту: 5-10 рабочих дней
- Возврат банковским переводом: 3-5 рабочих дней

5.3. Возвраты будут произведены на исходный способ оплаты, использованный для заказа.

## 6. Валюта

6.1. Все цены отображаются в валюте вашего региона.

6.2. Для международных заказов цены могут быть конвертированы в вашу местную валюту при оформлении заказа.

6.3. Курсы обмена определяются вашим платежным провайдером и могут варьироваться.

## 7. Проблемы с оплатой

7.1. Если вы столкнулись с какими-либо проблемами с оплатой, немедленно свяжитесь с нашей службой поддержки.

7.2. Распространенные проблемы с оплатой:
- Отклонение платежа
- Двойное списание
- Платеж не отражен в статусе заказа
- Возврат не получен

7.3. Мы расследуем и решим проблемы с оплатой в течение 2-3 рабочих дней.

## 8. Условия оплаты

8.1. Оплата должна быть завершена до начала обработки заказа (для онлайн-платежей).

8.2. Для заказов с оплатой наличными при получении оплата производится при доставке.

8.3. Мы оставляем за собой право отменить заказы, если оплата не может быть проверена или обработана.

Дата последнего обновления: ${new Date().toLocaleDateString('ru-RU')}`,
    },
    seoTitle: {
      en: 'Payment Policy - Payment Methods and Security',
      de: 'Zahlungsrichtlinie - Zahlungsmethoden und Sicherheit',
      fr: 'Politique de paiement - Méthodes de paiement et sécurité',
      es: 'Política de pago - Métodos de pago y seguridad',
      ua: 'Политика оплаты - Способы оплаты и безопасность',
    },
    seoDescription: {
      en: 'Learn about our accepted payment methods, payment security, and refund policies. Secure payment processing guaranteed.',
      de: 'Erfahren Sie mehr über unsere akzeptierten Zahlungsmethoden, Zahlungssicherheit und Rückerstattungsrichtlinien. Sichere Zahlungsabwicklung garantiert.',
      fr: 'Découvrez nos méthodes de paiement acceptées, la sécurité des paiements et les politiques de remboursement. Traitement sécurisé des paiements garanti.',
      es: 'Conozca nuestros métodos de pago aceptados, seguridad de pagos y políticas de reembolso. Procesamiento seguro de pagos garantizado.',
      ua: 'Узнайте о наших способах оплаты, безопасности платежей и политике возврата. Гарантированная безопасная обработка платежей.',
    },
    seoKeywords: {
      en: 'payment, payment methods, payment security, cash on delivery, card payment, online payment',
      de: 'Zahlung, Zahlungsmethoden, Zahlungssicherheit, Nachnahme, Kartenzahlung, Online-Zahlung',
      fr: 'paiement, méthodes de paiement, sécurité des paiements, paiement à la livraison, paiement par carte, paiement en ligne',
      es: 'pago, métodos de pago, seguridad de pagos, pago contra reembolso, pago con tarjeta, pago en línea',
      ua: 'оплата, способы оплаты, безопасность платежей, наличными при получении, оплата картой, онлайн-оплата',
    },
    order: 5,
  },
  {
    title: {
      en: 'Returns',
      de: 'Rückgabe',
      fr: 'Retours',
      es: 'Devoluciones',
      ua: 'Повернення',
    },
    slug: 'returns',
    content: {
      en: `# Returns and Refunds Policy

## 1. Return Policy

1.1. We want you to be completely satisfied with your purchase. If you are not satisfied, you may return eligible items within the return period.

1.2. **Return Period**: 14 days from the date of delivery for most items.

1.3. Items must be returned in their original condition:
- Unused and unopened
- In original packaging
- With all tags and labels attached
- With original receipt or proof of purchase

## 2. Eligible Items for Return

2.1. Most items can be returned if they meet the return conditions.

2.2. **Non-returnable items**:
- Perishable goods
- Customized or personalized items
- Items damaged by customer misuse
- Items without original packaging
- Items purchased on sale (unless defective)

2.3. Digital products and services are generally non-returnable unless otherwise stated.

## 3. Return Process

3.1. **Step 1**: Contact our customer service to initiate a return
- Email: info@payde.com
- Phone: Available on our contacts page
- Include your order number and reason for return

3.2. **Step 2**: Receive return authorization
- We will provide you with a Return Authorization (RA) number
- Follow the instructions provided

3.3. **Step 3**: Package and ship the item
- Use original packaging if possible
- Include the RA number in the package
- Ship to the address provided by customer service

3.4. **Step 4**: Receive refund or exchange
- Once we receive and inspect the item, we will process your refund or exchange
- You will be notified via email

## 4. Return Shipping

4.1. **Customer responsibility**: Return shipping costs are generally the customer's responsibility unless:
- Item was defective or damaged upon arrival
- Wrong item was sent
- Item does not match description

4.2. If the return is due to our error, we will provide a prepaid return shipping label.

4.3. We recommend using a trackable shipping method for returns.

## 5. Refunds

5.1. **Refund Processing Time**:
- After we receive the returned item: 3-5 business days
- Credit card refunds: 5-10 business days to appear on your statement
- Bank transfer refunds: 3-5 business days

5.2. **Refund Amount**:
- Full refund for items returned in original condition
- Original shipping costs are non-refundable (unless return is due to our error)
- Return shipping costs are not refunded (unless return is due to our error)

5.3. **Refund Method**:
- Refunds will be issued to the original payment method
- For cash on delivery orders, refunds will be processed via bank transfer

## 6. Exchanges

6.1. Exchanges are available for:
- Defective items
- Wrong size or color (subject to availability)
- Items that do not match description

6.2. Exchange process follows the same steps as returns.

6.3. If the replacement item is more expensive, you will be charged the difference.

6.4. If the replacement item is less expensive, you will receive a refund for the difference.

## 7. Damaged or Defective Items

7.1. If you receive a damaged or defective item:
- Contact us immediately (within 48 hours of delivery)
- Provide photos of the damage or defect
- We will arrange for replacement or full refund
- Return shipping will be at our expense

7.2. Do not use damaged or defective items, as this may affect your return eligibility.

## 8. Late or Missing Refunds

8.1. If you haven't received your refund within the expected timeframe:
- Check your bank account or credit card statement
- Contact your bank or credit card company
- Contact our customer service if the issue persists

8.2. We will investigate and resolve refund issues promptly.

## 9. Return Restrictions

9.1. We reserve the right to refuse returns that:
- Do not meet return conditions
- Are returned after the return period
- Show signs of use or damage not present at delivery
- Are missing parts or accessories

9.2. Items returned in unacceptable condition may be sent back to the customer at their expense.

Last updated: ${new Date().toLocaleDateString('en-US')}`,
      de: `# Rückgabe- und Rückerstattungsrichtlinie

## 1. Rückgaberichtlinie

1.1. Wir möchten, dass Sie mit Ihrem Kauf vollständig zufrieden sind. Wenn Sie nicht zufrieden sind, können Sie berechtigte Artikel innerhalb der Rückgabefrist zurückgeben.

1.2. **Rückgabefrist**: 14 Tage ab dem Lieferdatum für die meisten Artikel.

1.3. Artikel müssen in ihrem ursprünglichen Zustand zurückgegeben werden:
- Unbenutzt und ungeöffnet
- In der Originalverpackung
- Mit allen Etiketten und Aufklebern
- Mit Originalbeleg oder Kaufnachweis

## 2. Zurückgabefähige Artikel

2.1. Die meisten Artikel können zurückgegeben werden, wenn sie die Rückgabebedingungen erfüllen.

2.2. **Nicht zurückgabefähige Artikel**:
- Verderbliche Waren
- Individuelle oder personalisierte Artikel
- Durch Kundenmissbrauch beschädigte Artikel
- Artikel ohne Originalverpackung
- Artikel, die im Angebot gekauft wurden (außer bei Mängeln)

2.3. Digitale Produkte und Dienstleistungen sind in der Regel nicht zurückgabefähig, sofern nicht anders angegeben.

## 3. Rückgabeprozess

3.1. **Schritt 1**: Kontaktieren Sie unseren Kundenservice, um eine Rückgabe zu initiieren
- E-Mail: info@payde.com
- Telefon: Verfügbar auf unserer Kontaktseite
- Geben Sie Ihre Bestellnummer und den Grund für die Rückgabe an

3.2. **Schritt 2**: Erhalten Sie eine Rückgabeautorisierung
- Wir stellen Ihnen eine Rückgabeautorisierungsnummer (RA) zur Verfügung
- Befolgen Sie die bereitgestellten Anweisungen

3.3. **Schritt 3**: Verpacken und versenden Sie den Artikel
- Verwenden Sie nach Möglichkeit die Originalverpackung
- Fügen Sie die RA-Nummer in das Paket ein
- Versenden Sie an die vom Kundenservice angegebene Adresse

3.4. **Schritt 4**: Erhalten Sie Rückerstattung oder Umtausch
- Sobald wir den Artikel erhalten und überprüft haben, bearbeiten wir Ihre Rückgabe oder Ihren Umtausch
- Sie werden per E-Mail benachrichtigt

## 4. Rücksendung

4.1. **Kundenverantwortung**: Die Rücksendekosten sind in der Regel die Verantwortung des Kunden, es sei denn:
- Der Artikel war defekt oder beschädigt bei Ankunft
- Falscher Artikel wurde gesendet
- Artikel entspricht nicht der Beschreibung

4.2. Wenn die Rückgabe auf unseren Fehler zurückzuführen ist, stellen wir ein vorausbezahltes Rücksendeetikett zur Verfügung.

4.3. Wir empfehlen die Verwendung einer nachverfolgbaren Versandmethode für Rückgaben.

## 5. Rückerstattungen

5.1. **Rückerstattungsverarbeitungszeit**:
- Nach Erhalt des zurückgegebenen Artikels: 3-5 Werktage
- Kreditkartenrückerstattungen: 5-10 Werktage, bis sie auf Ihrer Abrechnung erscheinen
- Banküberweisungsrückerstattungen: 3-5 Werktage

5.2. **Rückerstattungsbetrag**:
- Vollständige Rückerstattung für Artikel, die in Originalzustand zurückgegeben wurden
- Originale Versandkosten sind nicht erstattungsfähig (es sei denn, die Rückgabe ist auf unseren Fehler zurückzuführen)
- Rücksendekosten werden nicht erstattet (es sei denn, die Rückgabe ist auf unseren Fehler zurückzuführen)

5.3. **Rückerstattungsmethode**:
- Rückerstattungen werden auf die ursprüngliche Zahlungsmethode ausgegeben
- Für Nachnahmebestellungen werden Rückerstattungen per Banküberweisung bearbeitet

## 6. Umtausch

6.1. Umtausch ist verfügbar für:
- Defekte Artikel
- Falsche Größe oder Farbe (je nach Verfügbarkeit)
- Artikel, die nicht der Beschreibung entsprechen

6.2. Der Umtauschprozess folgt den gleichen Schritten wie Rückgaben.

6.3. Wenn der Ersatzartikel teurer ist, wird Ihnen die Differenz berechnet.

6.4. Wenn der Ersatzartikel günstiger ist, erhalten Sie eine Rückerstattung für die Differenz.

## 7. Beschädigte oder defekte Artikel

7.1. Wenn Sie einen beschädigten oder defekten Artikel erhalten:
- Kontaktieren Sie uns sofort (innerhalb von 48 Stunden nach Lieferung)
- Stellen Sie Fotos des Schadens oder Defekts zur Verfügung
- Wir arrangieren Ersatz oder vollständige Rückerstattung
- Die Rücksendung erfolgt auf unsere Kosten

7.2. Verwenden Sie beschädigte oder defekte Artikel nicht, da dies Ihre Rückgabeberechtigung beeinträchtigen kann.

## 8. Verspätete oder fehlende Rückerstattungen

8.1. Wenn Sie Ihre Rückerstattung nicht innerhalb des erwarteten Zeitraums erhalten haben:
- Überprüfen Sie Ihr Bankkonto oder Ihre Kreditkartenabrechnung
- Kontaktieren Sie Ihre Bank oder Kreditkartenfirma
- Kontaktieren Sie unseren Kundenservice, wenn das Problem weiterhin besteht

8.2. Wir werden Rückerstattungsprobleme umgehend untersuchen und lösen.

## 9. Rückgabebeschränkungen

9.1. Wir behalten uns das Recht vor, Rückgaben abzulehnen, die:
- Die Rückgabebedingungen nicht erfüllen
- Nach der Rückgabefrist zurückgegeben werden
- Anzeichen von Gebrauch oder Schäden zeigen, die bei der Lieferung nicht vorhanden waren
- Teile oder Zubehör fehlen

9.2. Artikel, die in unannehmbarem Zustand zurückgegeben werden, können dem Kunden auf dessen Kosten zurückgesendet werden.

Zuletzt aktualisiert: ${new Date().toLocaleDateString('de-DE')}`,
      fr: `# Politique de retours et remboursements

## 1. Politique de retour

1.1. Nous voulons que vous soyez entièrement satisfait de votre achat. Si vous n'êtes pas satisfait, vous pouvez retourner les articles éligibles dans le délai de retour.

1.2. **Délai de retour**: 14 jours à compter de la date de livraison pour la plupart des articles.

1.3. Les articles doivent être retournés dans leur état d'origine:
- Non utilisés et non ouverts
- Dans l'emballage d'origine
- Avec toutes les étiquettes et étiquettes attachées
- Avec le reçu original ou la preuve d'achat

## 2. Articles éligibles au retour

2.1. La plupart des articles peuvent être retournés s'ils répondent aux conditions de retour.

2.2. **Articles non retournables**:
- Denrées périssables
- Articles personnalisés ou personnalisés
- Articles endommagés par une mauvaise utilisation du client
- Articles sans emballage d'origine
- Articles achetés en solde (sauf s'ils sont défectueux)

2.3. Les produits et services numériques ne sont généralement pas retournables sauf indication contraire.

## 3. Processus de retour

3.1. **Étape 1**: Contactez notre service client pour initier un retour
- Email: info@payde.com
- Téléphone: Disponible sur notre page de contacts
- Incluez votre numéro de commande et la raison du retour

3.2. **Étape 2**: Recevez une autorisation de retour
- Nous vous fournirons un numéro d'autorisation de retour (RA)
- Suivez les instructions fournies

3.3. **Étape 3**: Emballer et expédier l'article
- Utilisez l'emballage d'origine si possible
- Incluez le numéro RA dans le colis
- Expédiez à l'adresse fournie par le service client

3.4. **Étape 4**: Recevez un remboursement ou un échange
- Une fois que nous avons reçu et inspecté l'article, nous traiterons votre retour ou échange
- Vous serez notifié par e-mail

## 4. Expédition de retour

4.1. **Responsabilité du client**: Les coûts d'expédition de retour sont généralement à la charge du client sauf si:
- L'article était défectueux ou endommagé à l'arrivée
- Un mauvais article a été envoyé
- L'article ne correspond pas à la description

4.2. Si le retour est dû à notre erreur, nous fournirons une étiquette d'expédition de retour prépayée.

4.3. Nous recommandons d'utiliser une méthode d'expédition traçable pour les retours.

## 5. Remboursements

5.1. **Délai de traitement du remboursement**:
- Après réception de l'article retourné: 3-5 jours ouvrables
- Remboursements par carte de crédit: 5-10 jours ouvrables pour apparaître sur votre relevé
- Remboursements par virement bancaire: 3-5 jours ouvrables

5.2. **Montant du remboursement**:
- Remboursement complet pour les articles retournés dans leur état d'origine
- Les coûts d'expédition d'origine ne sont pas remboursables (sauf si le retour est dû à notre erreur)
- Les coûts d'expédition de retour ne sont pas remboursés (sauf si le retour est dû à notre erreur)

5.3. **Méthode de remboursement**:
- Les remboursements seront émis sur la méthode de paiement d'origine
- Pour les commandes avec paiement à la livraison, les remboursements seront traités par virement bancaire

## 6. Échanges

6.1. Les échanges sont disponibles pour:
- Articles défectueux
- Mauvaise taille ou couleur (sous réserve de disponibilité)
- Articles qui ne correspondent pas à la description

6.2. Le processus d'échange suit les mêmes étapes que les retours.

6.3. Si l'article de remplacement est plus cher, la différence vous sera facturée.

6.4. Si l'article de remplacement est moins cher, vous recevrez un remboursement pour la différence.

## 7. Articles endommagés ou défectueux

7.1. Si vous recevez un article endommagé ou défectueux:
- Contactez-nous immédiatement (dans les 48 heures suivant la livraison)
- Fournissez des photos des dommages ou du défaut
- Nous organiserons un remplacement ou un remboursement complet
- L'expédition de retour sera à nos frais

7.2. N'utilisez pas d'articles endommagés ou défectueux, car cela peut affecter votre éligibilité au retour.

## 8. Remboursements tardifs ou manquants

8.1. Si vous n'avez pas reçu votre remboursement dans les délais prévus:
- Vérifiez votre compte bancaire ou votre relevé de carte de crédit
- Contactez votre banque ou votre société de carte de crédit
- Contactez notre service client si le problème persiste

8.2. Nous enquêterons et résoudrons les problèmes de remboursement rapidement.

## 9. Restrictions de retour

9.1. Nous nous réservons le droit de refuser les retours qui:
- Ne répondent pas aux conditions de retour
- Sont retournés après le délai de retour
- Présentent des signes d'utilisation ou de dommages qui n'étaient pas présents à la livraison
- Manquent de pièces ou d'accessoires

9.2. Les articles retournés dans un état inacceptable peuvent être renvoyés au client à ses frais.

Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}`,
      es: `# Política de devoluciones y reembolsos

## 1. Política de devolución

1.1. Queremos que esté completamente satisfecho con su compra. Si no está satisfecho, puede devolver artículos elegibles dentro del período de devolución.

1.2. **Período de devolución**: 14 días desde la fecha de entrega para la mayoría de los artículos.

1.3. Los artículos deben devolverse en su estado original:
- Sin usar y sin abrir
- En el embalaje original
- Con todas las etiquetas y etiquetas adjuntas
- Con el recibo original o comprobante de compra

## 2. Artículos elegibles para devolución

2.1. La mayoría de los artículos se pueden devolver si cumplen con las condiciones de devolución.

2.2. **Artículos no devolubles**:
- Bienes perecederos
- Artículos personalizados o personalizados
- Artículos dañados por mal uso del cliente
- Artículos sin embalaje original
- Artículos comprados en oferta (a menos que estén defectuosos)

2.3. Los productos y servicios digitales generalmente no son devolubles a menos que se indique lo contrario.

## 3. Proceso de devolución

3.1. **Paso 1**: Contacte a nuestro servicio al cliente para iniciar una devolución
- Email: info@payde.com
- Teléfono: Disponible en nuestra página de contactos
- Incluya su número de pedido y la razón de la devolución

3.2. **Paso 2**: Reciba autorización de devolución
- Le proporcionaremos un número de autorización de devolución (RA)
- Siga las instrucciones proporcionadas

3.3. **Paso 3**: Empaque y envíe el artículo
- Use el embalaje original si es posible
- Incluya el número RA en el paquete
- Envíe a la dirección proporcionada por el servicio al cliente

3.4. **Paso 4**: Reciba reembolso o intercambio
- Una vez que recibamos e inspeccionemos el artículo, procesaremos su devolución o intercambio
- Será notificado por correo electrónico

## 4. Envío de devolución

4.1. **Responsabilidad del cliente**: Los costos de envío de devolución son generalmente responsabilidad del cliente a menos que:
- El artículo estaba defectuoso o dañado al llegar
- Se envió el artículo incorrecto
- El artículo no coincide con la descripción

4.2. Si la devolución se debe a nuestro error, proporcionaremos una etiqueta de envío de devolución prepagada.

4.3. Recomendamos usar un método de envío rastreable para devoluciones.

## 5. Reembolsos

5.1. **Tiempo de procesamiento del reembolso**:
- Después de recibir el artículo devuelto: 3-5 días hábiles
- Reembolsos a tarjeta de crédito: 5-10 días hábiles para aparecer en su estado de cuenta
- Reembolsos por transferencia bancaria: 3-5 días hábiles

5.2. **Monto del reembolso**:
- Reembolso completo por artículos devueltos en estado original
- Los costos de envío originales no son reembolsables (a menos que la devolución se deba a nuestro error)
- Los costos de envío de devolución no se reembolsan (a menos que la devolución se deba a nuestro error)

5.3. **Método de reembolso**:
- Los reembolsos se emitirán al método de pago original
- Para pedidos con pago contra reembolso, los reembolsos se procesarán por transferencia bancaria

## 6. Intercambios

6.1. Los intercambios están disponibles para:
- Artículos defectuosos
- Talla o color incorrectos (sujeto a disponibilidad)
- Artículos que no coinciden con la descripción

6.2. El proceso de intercambio sigue los mismos pasos que las devoluciones.

6.3. Si el artículo de reemplazo es más caro, se le cobrará la diferencia.

6.4. Si el artículo de reemplazo es más barato, recibirá un reembolso por la diferencia.

## 7. Artículos dañados o defectuosos

7.1. Si recibe un artículo dañado o defectuoso:
- Contáctenos inmediatamente (dentro de las 48 horas posteriores a la entrega)
- Proporcione fotos del daño o defecto
- Organizaremos un reemplazo o reembolso completo
- El envío de devolución será a nuestro cargo

7.2. No use artículos dañados o defectuosos, ya que esto puede afectar su elegibilidad para devolución.

## 8. Reembolsos tardíos o faltantes

8.1. Si no ha recibido su reembolso dentro del tiempo esperado:
- Verifique su cuenta bancaria o estado de cuenta de tarjeta de crédito
- Contacte a su banco o compañía de tarjeta de crédito
- Contacte a nuestro servicio al cliente si el problema persiste

8.2. Investigaremos y resolveremos los problemas de reembolso rápidamente.

## 9. Restricciones de devolución

9.1. Nos reservamos el derecho de rechazar devoluciones que:
- No cumplan con las condiciones de devolución
- Se devuelvan después del período de devolución
- Muestren signos de uso o daño que no estaban presentes en la entrega
- Faltan piezas o accesorios

9.2. Los artículos devueltos en condiciones inaceptables pueden ser enviados de vuelta al cliente a su cargo.

Última actualización: ${new Date().toLocaleDateString('es-ES')}`,
      ua: `# Политика возврата и возмещения

## 1. Политика возврата

1.1. Мы хотим, чтобы вы были полностью довольны своей покупкой. Если вы не удовлетворены, вы можете вернуть подходящие товары в течение периода возврата.

1.2. **Период возврата**: 14 дней с даты доставки для большинства товаров.

1.3. Товары должны быть возвращены в их первоначальном состоянии:
- Неиспользованные и нераспакованные
- В оригинальной упаковке
- Со всеми бирками и этикетками
- С оригинальным чеком или подтверждением покупки

## 2. Товары, подлежащие возврату

2.1. Большинство товаров могут быть возвращены, если они соответствуют условиям возврата.

2.2. **Товары, не подлежащие возврату**:
- Скоропортящиеся товары
- Индивидуализированные или персонализированные товары
- Товары, поврежденные неправильным использованием клиентом
- Товары без оригинальной упаковки
- Товары, купленные на распродаже (если не дефектные)

2.3. Цифровые продукты и услуги, как правило, не подлежат возврату, если не указано иное.

## 3. Процесс возврата

3.1. **Шаг 1**: Свяжитесь с нашей службой поддержки для инициации возврата
- Email: info@payde.com
- Телефон: Доступен на нашей странице контактов
- Укажите номер заказа и причину возврата

3.2. **Шаг 2**: Получите разрешение на возврат
- Мы предоставим вам номер разрешения на возврат (RA)
- Следуйте предоставленным инструкциям

3.3. **Шаг 3**: Упакуйте и отправьте товар
- Используйте оригинальную упаковку, если возможно
- Включите номер RA в посылку
- Отправьте по адресу, предоставленному службой поддержки

3.4. **Шаг 4**: Получите возмещение или обмен
- После получения и проверки товара мы обработаем ваш возврат или обмен
- Вы будете уведомлены по электронной почте

## 4. Доставка возврата

4.1. **Ответственность клиента**: Расходы на доставку возврата, как правило, являются ответственностью клиента, за исключением случаев, когда:
- Товар был дефектным или поврежденным при получении
- Был отправлен неправильный товар
- Товар не соответствует описанию

4.2. Если возврат связан с нашей ошибкой, мы предоставим предоплаченную этикетку для доставки возврата.

4.3. Мы рекомендуем использовать отслеживаемый способ доставки для возвратов.

## 5. Возмещение

5.1. **Время обработки возмещения**:
- После получения возвращенного товара: 3-5 рабочих дней
- Возврат на кредитную карту: 5-10 рабочих дней для отображения в выписке
- Возврат банковским переводом: 3-5 рабочих дней

5.2. **Сумма возмещения**:
- Полное возмещение за товары, возвращенные в оригинальном состоянии
- Оригинальные расходы на доставку не подлежат возмещению (если возврат не связан с нашей ошибкой)
- Расходы на доставку возврата не возмещаются (если возврат не связан с нашей ошибкой)

5.3. **Способ возмещения**:
- Возмещение будет произведено на исходный способ оплаты
- Для заказов с оплатой наличными при получении возмещение будет обработано банковским переводом

## 6. Обмен

6.1. Обмен доступен для:
- Дефектных товаров
- Неправильного размера или цвета (при наличии)
- Товаров, не соответствующих описанию

6.2. Процесс обмена следует тем же шагам, что и возврат.

6.3. Если товар на замену дороже, с вас будет взиматься разница.

6.4. Если товар на замену дешевле, вы получите возмещение за разницу.

## 7. Поврежденные или дефектные товары

7.1. Если вы получили поврежденный или дефектный товар:
- Свяжитесь с нами немедленно (в течение 48 часов с момента доставки)
- Предоставьте фотографии повреждения или дефекта
- Мы организуем замену или полное возмещение
- Доставка возврата будет за наш счет

7.2. Не используйте поврежденные или дефектные товары, так как это может повлиять на ваше право на возврат.

## 8. Задержка или отсутствие возмещения

8.1. Если вы не получили возмещение в ожидаемые сроки:
- Проверьте свой банковский счет или выписку по кредитной карте
- Свяжитесь с вашим банком или компанией кредитных карт
- Свяжитесь с нашей службой поддержки, если проблема сохраняется

8.2. Мы расследуем и решим проблемы с возмещением оперативно.

## 9. Ограничения на возврат

9.1. Мы оставляем за собой право отказать в возврате, если:
- Товары не соответствуют условиям возврата
- Возвращены после периода возврата
- Показывают признаки использования или повреждения, отсутствовавшие при доставке
- Отсутствуют части или аксессуары

9.2. Товары, возвращенные в неприемлемом состоянии, могут быть отправлены обратно клиенту за его счет.

Дата последнего обновления: ${new Date().toLocaleDateString('ru-RU')}`,
    },
    seoTitle: {
      en: 'Returns and Refunds Policy',
      de: 'Rückgabe- und Rückerstattungsrichtlinie',
      fr: 'Politique de retours et remboursements',
      es: 'Política de devoluciones y reembolsos',
      ua: 'Политика возврата и возмещения',
    },
    seoDescription: {
      en: 'Learn about our return policy, refund process, and exchange options. 14-day return period for eligible items.',
      de: 'Erfahren Sie mehr über unsere Rückgaberichtlinie, den Rückerstattungsprozess und Austauschoptionen. 14-tägige Rückgabefrist für berechtigte Artikel.',
      fr: 'Découvrez notre politique de retour, le processus de remboursement et les options d\'échange. Période de retour de 14 jours pour les articles éligibles.',
      es: 'Conozca nuestra política de devolución, proceso de reembolso y opciones de intercambio. Período de devolución de 14 días para artículos elegibles.',
      ua: 'Узнайте о нашей политике возврата, процессе возмещения и вариантах обмена. 14-дневный период возврата для подходящих товаров.',
    },
    seoKeywords: {
      en: 'returns, refunds, return policy, exchange, return process',
      de: 'Rückgaben, Rückerstattungen, Rückgaberichtlinie, Austausch, Rückgabeprozess',
      fr: 'retours, remboursements, politique de retour, échange, processus de retour',
      es: 'devoluciones, reembolsos, política de devolución, intercambio, proceso de devolución',
      ua: 'возврат, возмещение, политика возврата, обмен, процесс возврата',
    },
    order: 6,
  },
]

// Meta information
const seedMeta: SeedDefinition['meta'] = {
  name: 'Legal Documents',
  versions: [
    {
      version: '3.0.0',
      description: 'Added Shipping, Payment, and Returns policies. Multilingual support (English, German, French, Spanish, and Ukrainian) for all legal documents.',
      created_at: new Date().toISOString().split('T')[0],
    },
  ],
}

// Function to generate seed data
function generateSeedData(): SeedData {
  return {
    __meta__: seedMeta,
    texts: legalDocumentTemplates.map((template) => ({
      uuid: crypto.randomUUID(),
      taid: generateAid('t'),
      title: JSON.stringify(template.title), // Store as JSON string for multilingual support
      content: JSON.stringify(template.content), // Store as JSON string for multilingual support
      type: 'legal',
      statusName: 'PUBLISHED',
      isPublic: true,
      order: template.order,
      data_in: JSON.stringify({
        slug: template.slug,
        seoTitle: template.seoTitle ? JSON.stringify(template.seoTitle) : JSON.stringify(template.title),
        seoDescription: template.seoDescription ? JSON.stringify(template.seoDescription) : '',
        seoKeywords: template.seoKeywords ? JSON.stringify(template.seoKeywords) : '',
      }),
    })),
  }
}

// Seed definition
export const legalDocumentsSeed: SeedDefinition = {
  id: 'legal-documents',
  meta: seedMeta,
  getData: generateSeedData,
}
