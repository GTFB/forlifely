// AI Service for Next.js
// Handles asynchronous AI requests

interface AIAskRequest {
  model: string;
  prompt: any; // Can be string or object (contents array)
}

interface AIAskResponse {
  requestId: string;
  model?: string;
  content?: string;
}

interface AIResultResponse {
  requestId: string;
  status: string;
  provider?: string;
  model?: string;
  cost?: number;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  createdAt?: string;
  content?: string;
  error?: string | null;
}

export class AIService {
  private apiUrl: string;
  private apiToken: string;

  constructor(apiUrl: string, apiToken: string) {
    this.apiUrl = apiUrl;
    this.apiToken = apiToken;
  }

  /**
   * Send a request to AI API
   * @param model - Model name
   * @param prompt - Can be a string or an object (e.g., contents array for chat history)
   */
  async ask(model: string, prompt: any): Promise<string> {
    try {
      const requestBody = {
        model,
        prompt: prompt
      };
      
      console.log(`AI Request: model=${model}, token=${this.apiToken ? 'SET' : 'MISSING'}`);
      
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', `Bearer ${this.apiToken}`);
      
      const raw = JSON.stringify(requestBody);

      const url = `${this.apiUrl}/ask`;

      const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: raw,
          redirect: 'follow'
        });

      console.log(`AI Response status: ${response.status}, statusText: ${response.statusText}`);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.log('Error response text:', errorText);
        } catch (e) {
          console.error('Error reading response text:', e);
          errorText = `Unable to read error: ${e}`;
        }
        
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }

      const data: AIAskResponse = await response.json();

      // If response is cached, return it immediately
      if (data.content) {
        console.log(`✅ AI response (cached): ${data.requestId}`);
        return data.content;
      }

      // Otherwise, poll for result
      console.log(`⏳ Waiting for AI response: ${data.requestId}`);
      return await this.getResult(data.requestId);
    } catch (error) {
      console.error('Error in AI service ask:', error);
      throw error;
    }
  }

  /**
   * Upload a file (voice) for transcription
   * Returns transcribed text (polls by requestId if needed)
   */
  async upload(model: string, file: Blob, filename: string): Promise<string> {
    try {
      console.log(`AI Upload: model=${model}, token=${this.apiToken ? 'SET' : 'MISSING'}, filename=${filename}`);

      const formData = new FormData();
      formData.append('file', file, filename);
      formData.append('model', model);

      const headers = new Headers();
      headers.append('Authorization', `Bearer ${this.apiToken}`);

      const url = `${this.apiUrl}/upload`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

      console.log(`AI Upload response status: ${response.status}, statusText: ${response.statusText}`);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.log('Upload error response text:', errorText);
        } catch (e) {
          console.error('Error reading upload response text:', e);
          errorText = `Unable to read error: ${e}`;
        }
        throw new Error(`AI upload error: ${response.status} - ${errorText}`);
      }

      const data: AIAskResponse = await response.json();

      if (data.content) {
        console.log(`✅ AI upload response (cached): ${data.requestId}`);
        return data.content;
      }

      console.log(`⏳ Waiting for AI upload result: ${data.requestId}`);
      return await this.getResult(data.requestId);
    } catch (error) {
      console.error('Error in AI service upload:', error);
      throw error;
    }
  }

  /**
   * Poll for AI result by requestId
   * Retries with exponential backoff
   */
  private async getResult(requestId: string, maxAttempts: number = 10): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.sleep(1000);

        const response = await fetch(`${this.apiUrl}/result/${requestId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiToken}`
            }
          });

        if (!response.ok) {
          console.error(`Error getting result (attempt ${attempt}):`, response.status);
          continue;
        }

        const data: AIResultResponse = await response.json();

        if (data.status === 'SUCCESS' && data.content) {
          console.log(`✅ AI response received: ${data.requestId}`);
          return data.content;
        }

        if (data.status === 'FAILED' || data.error) {
          console.error(`❌ AI request failed: ${data.error}`);
          throw new Error(data.error || 'AI request failed');
        }

        console.log(`⏳ Still processing (attempt ${attempt}/${maxAttempts})...`);
      } catch (error) {
        console.error(`Error in getResult attempt ${attempt}:`, error);
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error('AI request timeout');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validates and fixes HTML tags in AI response
   * Removes unclosed opening tags and orphaned closing tags
   * Supports Telegram HTML tags: <b>, <i>, <u>, <code>, <a href="...">
   */
  validateAndFixHTML(html: string): string {
    const allowedTags = ['b', 'i', 'u', 'code', 'a'];
    
    interface TagInfo {
      type: 'open' | 'close';
      tag: string;
      fullTag: string;
      position: number;
    }
    
    const tags: TagInfo[] = [];
    const tagRegex = /<\/?(\w+)(?:\s+[^>]*)?>/g;
    let match;
    
    while ((match = tagRegex.exec(html)) !== null) {
      const tagName = match[1].toLowerCase();
      if (allowedTags.includes(tagName)) {
        tags.push({
          type: match[0].startsWith('</') ? 'close' : 'open',
          tag: tagName,
          fullTag: match[0],
          position: match.index
        });
      }
    }
    
    const keepTags = new Set<number>();
    const openTagsStack: Array<{ tag: string; index: number }> = [];
    
    for (let i = 0; i < tags.length; i++) {
      const tagInfo = tags[i];
      
      if (tagInfo.type === 'open') {
        openTagsStack.push({ tag: tagInfo.tag, index: i });
        keepTags.add(i);
      } else {
        let found = false;
        for (let j = openTagsStack.length - 1; j >= 0; j--) {
          if (openTagsStack[j].tag === tagInfo.tag) {
            keepTags.add(i);
            openTagsStack.splice(j, 1);
            found = true;
            break;
          }
        }
        if (!found) {
          console.log(`⚠️ Removing orphaned closing tag: ${tagInfo.fullTag}`);
        }
      }
    }
    
    for (const { index } of openTagsStack) {
      console.log(`⚠️ Removing unclosed opening tag: ${tags[index].fullTag}`);
      keepTags.delete(index);
    }
    
    const result: string[] = [];
    let lastPos = 0;
    
    for (let i = 0; i < tags.length; i++) {
      const tagInfo = tags[i];
      
      if (keepTags.has(i)) {
        result.push(html.substring(lastPos, tagInfo.position));
        result.push(tagInfo.fullTag);
        lastPos = tagInfo.position + tagInfo.fullTag.length;
      } else {
        result.push(html.substring(lastPos, tagInfo.position));
        lastPos = tagInfo.position + tagInfo.fullTag.length;
      }
    }
    
    result.push(html.substring(lastPos));
    
    return result.join('');
  }
}

