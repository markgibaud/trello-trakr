// Trello API Types

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idLabels?: string[];
  labels: TrelloLabel[];
  url: string;
  due?: string | null;
  dueComplete?: boolean;
  pos?: number;
  idBoard?: string;
  idList?: string;
  shortUrl?: string;
  dateLastActivity?: string;
  [key: string]: any; // For other properties that might be returned
}

export interface TrelloBoard {
  id: string;
  name: string;
}

export interface TrelloCredentials {
  apiKey: string;
  apiToken: string;
  boardId: string;
}
