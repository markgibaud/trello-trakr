import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { TrelloCard } from '../types/trello';
import { getCards, saveCards } from '../services/browser';
import './CardCanvas.css';

// Draggable Card Component
interface DraggableCardProps {
  id: string;
  name: string;
  desc: string;
  due: string | null | undefined;
  url?: string;
  labels: Array<{ id: string; name: string; color: string }>;
  x: number;
  y: number;
  moveCard: (id: string, x: number, y: number) => void;
  formatDueDate?: (dateString: string | null | undefined) => string;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  id,
  name,
  desc,
  due,
  labels = [],
  x = 0,
  y = 0,
  moveCard = () => {},
  formatDueDate = (date: string | null | undefined) => date || 'No due date'
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Set up drag functionality
  const [{ isDragging: isCardDragging }, drag] = useDrag({
    type: 'card',
    item: () => ({ id, x, y }),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (_, monitor) => {
      setIsDragging(false);
      
      // Get the final drop result
      const didDrop = monitor.didDrop();
      if (!didDrop) return;
      
      // Get the final position
      const dropResult = monitor.getDropResult<{ x: number, y: number }>();
      if (dropResult && (dropResult.x !== x || dropResult.y !== y)) {
        moveCard(id, dropResult.x, dropResult.y);
      }
    },
  });
  
  // Set up drop functionality
  const [, drop] = useDrop({
    accept: 'card',
    hover: (item: { id: string; x: number; y: number }, monitor) => {
      if (!ref.current) return;
      if (item.id === id) return; // Don't hover on self
      
      // Get the mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
    },
    drop: (item: { id: string; x: number; y: number }, monitor) => {
      if (item.id !== id) return; // Only handle drops for this card
      
      // Get the final mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // Get the canvas element to calculate relative position
      const canvas = document.querySelector('.card-canvas');
      if (!canvas) return;
      
      const canvasRect = canvas.getBoundingClientRect();
      
      // Calculate the new position relative to the canvas
      const newX = clientOffset.x - canvasRect.left - (ref.current?.offsetWidth || 0) / 2;
      const newY = clientOffset.y - canvasRect.top - 20; // Offset for better grip
      
      // Return the new position as the drop result
      return {
        x: newX,
        y: newY
      };
    }
  });
  
  // Combine drag and drop refs with drag state tracking
  const dragDropRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Update the ref
      ref.current = node;
      
      // Initialize drag and drop with proper event handling
      if (node) {
        // Apply the drag and drop refs
        drag(node);
        drop(node);
        
        // Add event listeners for drag state
        const handleDragStart = () => {
          node.classList.add('dragging');
          // Update drag state
          setIsDragging(true);
        };
        
        const handleDragEnd = () => {
          node.classList.remove('dragging');
          // Update drag state
          setIsDragging(false);
        };
        
        node.addEventListener('dragstart', handleDragStart);
        node.addEventListener('dragend', handleDragEnd);
        
        // Return cleanup function
        return () => {
          node.removeEventListener('dragstart', handleDragStart);
          node.removeEventListener('dragend', handleDragEnd);
        };
      }
      
      return undefined;
    },
    [drag, drop] // moveCard is stable and doesn't need to be in the dependency array
  );
  
  // Cleanup on unmount and handle drag state changes
  useEffect(() => {
    const updateCursor = () => {
      if (isCardDragging) {
        document.body.style.cursor = 'grabbing';
      } else {
        document.body.style.cursor = '';
      }
    };
    
    updateCursor();
    
    return () => {
      document.body.style.cursor = '';
      if (ref.current) {
        ref.current = null;
      }
    };
  }, [isCardDragging]);
  
  // Update parent component about drag state
  useEffect(() => {
    // When card starts or stops dragging, update the parent
    if (isCardDragging) {
      // Inform parent component that dragging has started
      const event = new CustomEvent('cardDragStart', { detail: { id } });
      document.dispatchEvent(event);
    } else {
      // Inform parent component that dragging has ended
      const event = new CustomEvent('cardDragEnd', { detail: { id } });
      document.dispatchEvent(event);
    }
    
    return () => {
      // Ensure we clean up if component unmounts while dragging
      if (isCardDragging) {
        const event = new CustomEvent('cardDragEnd', { detail: { id } });
        document.dispatchEvent(event);
      }
    };
  }, [isCardDragging, id]);

  // Format the due date for display
  const formattedDueDate = useMemo(() => {
    if (formatDueDate) {
      return formatDueDate(due);
    }
    if (!due) return 'No due date';
    try {
      const date = new Date(due);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return due;
    }
  }, [due, formatDueDate]);

  return (
    <div
      ref={dragDropRef}
      className={`trello-card ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        opacity: isCardDragging ? 0.5 : 1,
        cursor: 'grab',
        position: 'absolute',
      }}
      onMouseDown={() => document.body.style.cursor = 'grabbing'}
      onMouseUp={() => document.body.style.cursor = 'grab'}
      onMouseLeave={() => document.body.style.cursor = 'grab'}
    >
      {labels && labels.length > 0 && (
        <div className="card-labels">
          {labels.map((label, index) => (
            <span
              key={index}
              className="card-label"
              style={{ backgroundColor: label.color || '#61bd4f' }}
              title={label.name}
            />
          ))}
        </div>
      )}
      <h3 className="card-title">{name || 'Untitled'}</h3>
      {desc && <p className="card-description">{desc}</p>}
      {due && (
        <div className="card-due-date">
          <span className="due-date-label">Due:</span>{' '}
          <span className="due-date">{formattedDueDate}</span>
        </div>
      )}
    </div>
  );
};

// Type for card with position
type CardWithPosition = TrelloCard & { x: number; y: number };

// Main Canvas Component
interface CardCanvasProps {
  onReset: () => void;
}

const CardCanvas: React.FC<CardCanvasProps> = ({ onReset }) => {
  const [arrangedCards, setArrangedCards] = useState<CardWithPosition[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Listen for drag events from cards
  useEffect(() => {
    const handleCardDragStart = () => setIsDragging(true);
    const handleCardDragEnd = () => setIsDragging(false);
    
    document.addEventListener('cardDragStart', handleCardDragStart);
    document.addEventListener('cardDragEnd', handleCardDragEnd);
    
    return () => {
      document.removeEventListener('cardDragStart', handleCardDragStart);
      document.removeEventListener('cardDragEnd', handleCardDragEnd);
    };
  }, []);

  // Move card to new position
  const moveCard = useCallback((id: string, x: number, y: number) => {
    console.log(`Moving card ${id} to position (${x}, ${y})`);
    setArrangedCards(prevCards => {
      const updatedCards = prevCards.map(card => {
        if (card.id === id) {
          // Get canvas bounds
          const canvas = canvasRef.current;
          const canvasRect = canvas?.getBoundingClientRect();
          const cardWidth = 280; // Match the card width from CSS
          const cardHeight = 150; // Approximate card height
          
          // Calculate bounds based on canvas or window
          const maxX = canvasRect ? canvasRect.width - cardWidth : window.innerWidth - cardWidth - 40; // 40px padding
          const maxY = canvasRect ? canvasRect.height - cardHeight : window.innerHeight - cardHeight - 40;
          
          // Ensure position is within bounds
          const newX = Math.max(0, Math.min(maxX, x));
          const newY = Math.max(0, Math.min(maxY, y));
          
          return { 
            ...card, 
            x: newX, 
            y: newY 
          };
        }
        return card;
      });
      
      // Save the new positions to local storage
      console.log('Saving updated cards:', updatedCards);
      saveCards(updatedCards);
      return updatedCards;
    });
  }, []);
  
  // Handle window resize to keep cards within bounds
  useEffect(() => {
    const handleResize = () => {
      setArrangedCards(prevCards => 
        prevCards.map(card => ({
          ...card,
          x: Math.max(0, Math.min(window.innerWidth - 300, card.x)),
          y: Math.max(0, Math.min(window.innerHeight - 200, card.y))
        }))
      );
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Format due date for display
  const formatDueDate = useCallback((dateString: string | null | undefined): string => {
    if (!dateString) return 'No due date';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? 'Invalid date' 
        : date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }, []);
  
  // Memoize the card rendering to prevent unnecessary re-renders
  const renderCard = useCallback((card: CardWithPosition) => {
    // Ensure all required properties are defined
    const safeCard = {
      id: card.id,
      name: card.name || 'Untitled Card',
      desc: card.desc || '',
      due: card.due,
      labels: card.labels || [],
      x: card.x || 0,
      y: card.y || 0,
      formatDueDate
    };
    
    return <DraggableCard key={card.id} {...safeCard} moveCard={moveCard} />;
  }, [formatDueDate, moveCard]);

  // Initialize cards on mount
  useEffect(() => {
    const cards = getCards() as CardWithPosition[] | null;
    
    if (cards && cards.length > 0) {
      // If cards already have positions, use them
      if ('x' in cards[0]) {
        setArrangedCards(cards);
        return;
      }
      
      // Otherwise, arrange them in a grid
      const cardWidth = 220;
      const cardHeight = 140;
      
      const arranged = cards.map((card, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const randomX = Math.random() * 40 - 20;
        const randomY = Math.random() * 40 - 20;
        const x = Math.max(0, (col * (cardWidth + 40)) + 50 + randomX);
        const y = Math.max(0, (row * (cardHeight + 40)) + 50 + randomY);
        return { ...card, x, y };
      });
      
      setArrangedCards(arranged);
      saveCards(arranged);
    } else {
      // No cards found, set empty array
      setArrangedCards([]);
    }
  }, []);

  const handleResetClick = () => {
    if (window.confirm('Are you sure you want to reset and enter new credentials?')) {
      onReset();
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="card-canvas-container">
        <div className="card-canvas-header">
          <h2>AI Content Generator Cards</h2>
          <button 
            className="reset-button" 
            onClick={handleResetClick}
            disabled={isDragging}
          >
            Reset and Enter New Credentials
          </button>
        </div>
        
        <div 
          ref={canvasRef}
          className={`card-canvas ${isDragging ? 'dragging' : ''}`}
        >
          {arrangedCards.map(renderCard)}
          
          {/* Drop zone indicator */}
          {isDragging && (
            <div className="drop-zone">
              <span>Drop card here</span>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default CardCanvas;
