import { useState } from 'react'
import { TrelloInputForm } from './components/TrelloInputForm'
import './App.css'

function App() {
  const [trelloData, setTrelloData] = useState<{
    apiKey: string;
    apiToken: string;
    boardId: string;
  } | null>(null);

  const handleTrelloSubmit = (apiKey: string, apiToken: string, boardId: string) => {
    setTrelloData({ apiKey, apiToken, boardId });
    // In a real app, we would store this data in localStorage or a state management solution
    console.log('Trello credentials submitted:', { apiKey, apiToken, boardId });
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <h1 className="app-title">Trello Trakr</h1>
        
        {trelloData ? (
          <div className="connected-container">
            <p className="connected-text">Connected to Trello!</p>
            <p className="board-id-text">Board ID: {trelloData.boardId}</p>
            <button 
              className="disconnect-button"
              onClick={() => setTrelloData(null)}
            >
              Disconnect and enter new credentials
            </button>
          </div>
        ) : (
          <TrelloInputForm onSubmit={handleTrelloSubmit} />
        )}
      </div>
    </div>
  )
}

export default App
