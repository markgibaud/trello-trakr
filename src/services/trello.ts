/**
 * Trello service for interacting with the Trello API
 */
import { saveCards } from './browser';
import type { TrelloCredentials, TrelloLabel, TrelloCard } from '../types/trello';

// Using types from '../types/trello'

export class TrelloClient {
  private apiKey: string;
  private apiToken: string;
  private boardId: string;

  constructor(credentials: TrelloCredentials) {
    this.apiKey = credentials.apiKey;
    this.apiToken = credentials.apiToken;
    this.boardId = credentials.boardId;
  }

  /**
   * Save credentials to localStorage
   */
  saveCredentials(): void {
    localStorage.setItem('trello_credentials', JSON.stringify({
      apiKey: this.apiKey,
      apiToken: this.apiToken,
      boardId: this.boardId
    }));
  }

  /**
   * Get credentials from localStorage
   */
  static getCredentials(): TrelloCredentials | null {
    const credentials = localStorage.getItem('trello_credentials');
    return credentials ? JSON.parse(credentials) : null;
  }

  /**
   * Fetch all labels for a board
   */
  async getBoardLabels(): Promise<TrelloLabel[]> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${this.boardId}/labels?key=${this.apiKey}&token=${this.apiToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch labels: ${response.status} ${response.statusText}`);
      }
      
      const labels = await response.json();
      return labels;
    } catch (error) {
      console.error('Error fetching board labels:', error);
      throw error;
    }
  }

  /**
   * Fetch all cards with a specific label
   */
  async getCardsByLabel(labelId: string): Promise<TrelloCard[]> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/labels/${labelId}/cards?key=${this.apiKey}&token=${this.apiToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.status} ${response.statusText}`);
      }
      
      const cards = await response.json();
      
      // Save cards to localStorage using browser service
      saveCards(cards);
      
      return cards;
    } catch (error) {
      console.error('Error fetching cards by label:', error);
      throw error;
    }
  }
}
