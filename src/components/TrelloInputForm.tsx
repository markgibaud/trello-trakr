import React, { useState, useEffect } from 'react';
import './TrelloInputForm.css';
import { TrelloClient } from '../services/trello';
import type { TrelloLabel, TrelloCard } from '../services/trello';
import { saveSelectedLabel, getSelectedLabel } from '../services/browser';

interface TrelloInputFormProps {
  onSubmit: (apiKey: string, apiToken: string, boardId: string) => void;
}

export function TrelloInputForm({ onSubmit }: TrelloInputFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [boardId, setBoardId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<TrelloLabel[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<string>("");
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [connectionStep, setConnectionStep] = useState<
    "credentials" | "labels"
  >("credentials");

  // Check for saved credentials on component mount
  useEffect(() => {
    const savedCredentials = TrelloClient.getCredentials();
    if (savedCredentials) {
      setApiKey(savedCredentials.apiKey);
      setApiToken(savedCredentials.apiToken);
      setBoardId(savedCredentials.boardId);
    }

    const savedLabelId = getSelectedLabel();
    if (savedLabelId) {
      setSelectedLabelId(savedLabelId);
    }
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey && apiToken && boardId) {
      setIsConnecting(true);
      setError(null);

      try {
        // Create a new TrelloClient instance
        const trelloClient = new TrelloClient({ apiKey, apiToken, boardId });

        // Save credentials to localStorage
        trelloClient.saveCredentials();

        // Fetch board labels
        const boardLabels = await trelloClient.getBoardLabels();
        setLabels(boardLabels);

        // Move to label selection step
        setConnectionStep("labels");

        // Call the onSubmit callback
        onSubmit(apiKey, apiToken, boardId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to connect to Trello"
        );
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const handleLabelSelect = async () => {
    if (selectedLabelId) {
      setIsLoadingCards(true);
      setError(null);

      try {
        const trelloClient = new TrelloClient({ apiKey, apiToken, boardId });

        // Save selected label
        saveSelectedLabel(selectedLabelId);

        // Fetch cards with the selected label
        const labelCards = await trelloClient.getCardsByLabel(selectedLabelId);
        setCards(labelCards);

        // Log success
        console.log(
          `Fetched ${labelCards.length} cards with the selected label`
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch cards");
      } finally {
        setIsLoadingCards(false);
      }
    }
  };

  const renderCredentialsForm = () => (
    <form onSubmit={handleCredentialsSubmit}>
      <div className="form-group">
        <label htmlFor="apiKey">Trello API Key</label>
        <input
          id="apiKey"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Trello API Key"
          required
        />
        <p className="help-text">
          Get your API Key from{" "}
          <a href="https://trello.com/app-key" target="_blank" rel="noreferrer">
            Trello Developer API Keys
          </a>
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="apiToken">Trello API Token</label>
        <input
          id="apiToken"
          type="text"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder="Enter your Trello API Token"
          required
        />
        <p className="help-text">
          Generate a Token using the link on the API Key page
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="boardId">Trello Board ID</label>
        <input
          id="boardId"
          type="text"
          value={boardId}
          onChange={(e) => setBoardId(e.target.value)}
          placeholder="Enter your Trello Board ID"
          required
        />
        <p className="help-text">
          Found in the URL of your board: trello.com/b/xxxx/board-name
        </p>
      </div>

      <button type="submit" className="submit-button" disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect to Trello"}
      </button>
    </form>
  );

  const renderLabelSelection = () => (
    <div className="label-selection">
      <h2>Select a Label</h2>
      <p className="help-text">Choose a label to fetch cards with that label</p>

      {labels.length > 0 ? (
        <>
          <div className="form-group">
            <label htmlFor="labelSelect">Board Labels</label>
            <select
              id="labelSelect"
              value={selectedLabelId}
              onChange={(e) => setSelectedLabelId(e.target.value)}
              className="label-select"
            >
              <option value="">-- Select a label --</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name || "(Unnamed)"}{" "}
                  {label.color ? `(${label.color})` : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLabelSelect}
            className="submit-button"
            disabled={!selectedLabelId || isLoadingCards}
          >
            {isLoadingCards ? "Fetching Cards..." : "Fetch Cards with Label"}
          </button>

          {cards.length > 0 && (
            <div className="cards-summary">
              <p>
                Successfully fetched {cards.length} cards with the selected
                label!
              </p>
              <p>Cards have been saved to browser storage.</p>
            </div>
          )}
        </>
      ) : (
        <p>No labels found for this board.</p>
      )}

      <button
        onClick={() => setConnectionStep("credentials")}
        className="back-button"
      >
        Back to Credentials
      </button>
    </div>
  );

  return (
    <div className="form-container">
      {error && <div className="error-message">{error}</div>}

      {connectionStep === "credentials"
        ? renderCredentialsForm()
        : renderLabelSelection()}
    </div>
  );
}
