import EmojiPicker from 'emoji-picker-react';

/**
 * EmojiPicker wrapper component with dark mode support
 */
const EmojiPickerComponent = ({ onEmojiClick }) => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <EmojiPicker
      onEmojiClick={onEmojiClick}
      theme={isDark ? 'dark' : 'light'}
      width="100%"
      height={350}
      searchPlaceholder="Search emoji..."
      previewConfig={{ showPreview: false }}
      skinTonesDisabled
      lazyLoadEmojis
    />
  );
};

export default EmojiPickerComponent;
