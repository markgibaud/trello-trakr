import { useState, useEffect } from 'react';
import { TrelloInputForm } from './components/TrelloInputForm';
import CardCanvas from './components/CardCanvas';
import { getCards, initializeSampleCards, clearCards } from './services/browser';
import './App.css';

function App() {
  const [hasCards, setHasCards] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize sample cards when the app starts if needed
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeSampleCards();
        checkForCards();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true); // Ensure we don't get stuck in loading state
      }
    };

    initialize();
  }, []);

  const checkForCards = () => {
    const cards = getCards();
    setHasCards(!!(cards && cards.length > 0));
  };

  const handleCardsReset = () => {
    clearCards();
    setHasCards(false);
  };

  const handleTrelloSubmit = (apiKey: string, apiToken: string, boardId: string) => {
    // In a real app, we would store this data and fetch cards from Trello
    console.log('Trello credentials submitted:', { apiKey, apiToken, boardId });
    // For now, we'll just show the cards we have in localStorage
    checkForCards();
  };

  if (!isInitialized) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Trello Trakr</h1>
      </header>
      
      <main className="app-main">
        {hasCards ? (
          <div className="canvas-container">
            <CardCanvas onReset={handleCardsReset} />
          </div>
        ) : (
          <div className="form-container">
            <TrelloInputForm onSubmit={handleTrelloSubmit} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App
