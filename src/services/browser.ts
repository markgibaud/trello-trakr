/**
 * Browser service for managing browser storage operations
 */

/**
 * Save selected label ID to localStorage
 */
export function saveSelectedLabel(labelId: string): void {
  localStorage.setItem('selected_label_id', labelId);
}

/**
 * Get selected label ID from localStorage
 */
export function getSelectedLabel(): string | null {
  return localStorage.getItem('selected_label_id');
}

/**
 * Save cards to localStorage
 */
export function saveCards(cards: any[]): void {
  localStorage.setItem('trello_cards', JSON.stringify(cards));
}

/**
 * Get cards from localStorage
 */
export function getCards(): any[] | null {
  const cards = localStorage.getItem('trello_cards');
  return cards ? JSON.parse(cards) : null;
}
