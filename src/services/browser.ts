/**
 * Browser storage service for Trello Trakr
 */
import type { TrelloCard } from '../types/trello';
import { sampleCards } from '../data/sampleCards';

// Constants for localStorage keys
const CARDS_STORAGE_KEY = 'trello_trakr_cards';
const SELECTED_LABEL_KEY = 'trello_trakr_selected_label';

/**
 * Save selected label ID to localStorage
 */
export function saveSelectedLabel(labelId: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(SELECTED_LABEL_KEY, labelId);
}

/**
 * Get selected label ID from localStorage
 */
export function getSelectedLabel(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(SELECTED_LABEL_KEY);
}

/**
 * Save cards to localStorage
 */
export function saveCards(cards: TrelloCard[]): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
}

/**
 * Get cards from localStorage
 */
export function getCards(): TrelloCard[] {
  if (typeof window === 'undefined') return [];
  
  const cardsJson = localStorage.getItem(CARDS_STORAGE_KEY);
  return cardsJson ? JSON.parse(cardsJson) : [];
}

/**
 * Check if there are any cards in localStorage
 */
export function hasCards(): boolean {
  if (typeof window === 'undefined') return false;
  
  const cards = getCards();
  return cards && cards.length > 0;
}

/**
 * Initialize sample cards in localStorage if none exist
 * This is for development purposes only
 */
export function initializeSampleCards(): void {
  if (typeof window === 'undefined') return;
  
  const existingCards = localStorage.getItem(CARDS_STORAGE_KEY);
  if (!existingCards) {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(sampleCards));
  }
}

/**
 * Clear all cards from localStorage
 */
export function clearCards(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(CARDS_STORAGE_KEY);
}
