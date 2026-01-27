// frontend/src/components/ResizablePanel.jsx
import { useState, useRef, useEffect } from 'react';

export default function ResizablePanel({ 
  children, 
  defaultWidth = 360, 
  minWidth = 280, 
  maxWidth = 600,
  onResize 
}) {
  const [width, setWidth] = useState(() => {
    // Récupérer la largeur sauvegardée dans localStorage
    const savedWidth = localStorage.getItem('chatPanelWidth');
    return savedWidth ? parseInt(savedWidth) : defaultWidth;
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = Math.max(minWidth, Math.min(e.clientX, maxWidth));
      setWidth(newWidth);
      
      if (onResize) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Sauvegarder la largeur
      localStorage.setItem('chatPanelWidth', width.toString());
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, minWidth, maxWidth, width, onResize]);

  // Empêcher la sélection de texte pendant le redimensionnement
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  return (
    <div 
      ref={panelRef}
      className="relative h-full"
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Poignée de redimensionnement améliorée */}
      <div
        className="absolute right-0 top-0 h-full w-3 cursor-col-resize group"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        style={{
          transform: 'translateX(50%)',
          zIndex: 10
        }}
      >
        <div className="h-full w-px bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400 group-active:bg-blue-500 mx-auto transition-colors" />
      </div>
    </div>
  );
}