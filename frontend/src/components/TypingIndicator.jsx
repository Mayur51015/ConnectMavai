/**
 * TypingIndicator component - animated "User is typing..." bubble
 */
const TypingIndicator = ({ username }) => {
  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
      <span className="typing-text">{username} is typing...</span>
    </div>
  );
};

export default TypingIndicator;
