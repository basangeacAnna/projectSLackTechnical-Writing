import React from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface EmojiPickerPopupProps {
  /**
   * Callback when an emoji is selected
   * @param emoji Object with 'native' property (e.g., "😊")
   */
  onEmojiSelect: (emoji: { native: string }) => void;
  
  /**
   * Callback to close the picker
   */
  onClose: () => void;
}

/**
 * EmojiPickerPopup Component
 * 
 * Shows the emoji picker in a popover/modal.
 * Positions itself above the input and closes after selection.
 */
const EmojiPickerPopup: React.FC<EmojiPickerPopupProps> = ({
  onEmojiSelect,
  onClose
}) => {
  const handleEmojiSelect = (emoji: any) => {
    // Extract only the 'native' property (the emoji string)
    onEmojiSelect({ native: emoji.native });
    
    // Close automatically after selection (optional, can be kept open if preferred)
    // onClose(); 
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',        // Position above the input
        right: 0,              // Align to right (or left depending on design)
        zIndex: 1000,          // Above other elements
        marginBottom: '8px',
      }}
      className="emoji-picker-popup shadow-xl rounded-lg overflow-hidden"
    >
      {/* Overlay to close when clicking outside */}
      <div 
        className="fixed inset-0 z-[-1]" 
        onClick={onClose}
      />
      
      <Picker
        data={data}
        theme="dark"                  // Discord-like style (dark)
        locale="en"                   // English locale
        previewPosition="none"        // Hide big preview
        onEmojiSelect={handleEmojiSelect}
        
        // Optional customizations
        navPosition="bottom"          // Categories at bottom
        perLine={8}                   // 8 emojis per line
        searchPosition="top"          // Search bar at top
        skinTonePosition="search"     // Tone selector next to search
      />
    </div>
  );
};

export default EmojiPickerPopup;
