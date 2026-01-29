const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwim83u8Nr2xgBg7DnDz_FUPvUq75WJALHWGCuAggiz5oNqVJXfFDqM66nPIDjy3o03/exec";

interface FormSubmitData {
  name: string;
  phone: string;
  message: string;
}

export async function submitFormToGoogleAppsScript(data: FormSubmitData): Promise<void> {
  try {
    // Fire-and-forget: отправляем данные, но не ждем ответа
    fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Google Apps Script требует no-cors для веб-приложений
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).catch((error) => {
      // Тихо игнорируем ошибки, так как это fire-and-forget
      console.warn("Form submission error (ignored):", error);
    });
  } catch (error) {
    // Тихо игнорируем ошибки
    console.warn("Form submission error (ignored):", error);
  }
}

