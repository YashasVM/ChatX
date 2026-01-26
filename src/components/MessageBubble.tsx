interface Sender {
  _id: string;
  displayName: string;
  avatarColor: string;
}

interface Message {
  _id: string;
  content: string;
  senderId: string;
  sender: Sender | null;
  createdAt: number;
  readBy: string[];
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  isFirstInGroup,
  isLastInGroup,
}: MessageBubbleProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine border radius based on position in message group
  const getBorderRadius = () => {
    if (isOwn) {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-br-md';
      if (isFirstInGroup) return 'rounded-2xl rounded-br-md';
      if (isLastInGroup) return 'rounded-2xl rounded-tr-md rounded-br-md';
      return 'rounded-2xl rounded-r-md';
    } else {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-bl-md';
      if (isFirstInGroup) return 'rounded-2xl rounded-bl-md';
      if (isLastInGroup) return 'rounded-2xl rounded-tl-md rounded-bl-md';
      return 'rounded-2xl rounded-l-md';
    }
  };

  return (
    <div
      className={`flex items-end gap-2 animate-fade-in ${
        isOwn ? 'justify-end' : 'justify-start'
      } ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
    >
      {/* Avatar (only for others, only on first message of group) */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && message.sender && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: message.sender.avatarColor }}
            >
              {message.sender.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
        {/* Sender name (only for group chats, first message) */}
        {!isOwn && isFirstInGroup && message.sender && (
          <p className="text-xs text-gray mb-1 ml-1">{message.sender.displayName}</p>
        )}

        <div
          className={`px-4 py-2.5 ${getBorderRadius()} ${
            isOwn
              ? 'bg-charcoal text-cream'
              : 'bg-white text-charcoal border border-border'
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Time (only on last message of group) */}
        {isLastInGroup && (
          <p className={`text-xs text-gray mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
            {formatTime(message.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}
