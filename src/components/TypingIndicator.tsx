interface TypingUser {
  _id: string;
  displayName: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text = users.length === 1
    ? `${users[0].displayName} is typing`
    : users.length === 2
    ? `${users[0].displayName} and ${users[1].displayName} are typing`
    : `${users.length} people are typing`;

  return (
    <div className="flex items-center gap-2 mt-3 animate-fade-in">
      <div className="w-8" /> {/* Spacer for avatar alignment */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray rounded-full typing-dot" />
          <span className="w-2 h-2 bg-gray rounded-full typing-dot" />
          <span className="w-2 h-2 bg-gray rounded-full typing-dot" />
        </div>
        <span className="text-sm text-gray">{text}</span>
      </div>
    </div>
  );
}
