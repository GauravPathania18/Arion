export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

export async function exportToNotion(config: NotionConfig, title: string, content: string) {
  if (!config.apiKey || !config.databaseId) {
    throw new Error("Notion configuration missing");
  }

  // Note: In a real Chrome extension, this would be handled via background.js 
  // or a server-side proxy to avoid CORS and keep the API key safe.
  console.log("Mocking Notion Export:", { title, content });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return { success: true, url: `https://notion.so/${config.databaseId}` };
}
