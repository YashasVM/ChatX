import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { X, Users, Check } from 'lucide-react';

export function NewGroupModal() {
  const { user } = useAuth();
  const { setShowNewGroupModal, setActiveConversationId } = useChat();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const allUsers = useQuery(api.users.getAll);
  const createConversation = useMutation(api.conversations.create);

  const otherUsers = allUsers?.filter((u: { _id: string }) => u._id !== user?._id);

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!user || selectedUsers.length === 0 || !groupName.trim()) return;

    setIsCreating(true);
    try {
      const conversationId = await createConversation({
        participants: [user._id, ...selectedUsers],
        isGroup: true,
        groupName: groupName.trim(),
        creatorId: user._id,
      } as any);

      setActiveConversationId(conversationId);
      setShowNewGroupModal(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/50"
        onClick={() => setShowNewGroupModal(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-semibold text-charcoal">New Group</h2>
          <button
            onClick={() => setShowNewGroupModal(false)}
            className="p-2 hover:bg-cream-dark rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>

        {/* Group name input */}
        <div className="p-4 border-b border-border">
          <label className="block text-sm font-medium text-charcoal mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="w-full px-4 py-3 bg-cream-dark border border-border rounded-xl
                     text-charcoal placeholder:text-gray-light
                     focus:outline-none focus:border-charcoal transition-colors"
            autoFocus
          />
        </div>

        {/* User selection */}
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium text-charcoal mb-3">
            Select members ({selectedUsers.length} selected)
          </p>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {otherUsers?.map((u: { _id: string; displayName: string; avatarColor: string; username: string }) => {
              const isSelected = selectedUsers.includes(u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => toggleUser(u._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isSelected ? 'bg-cream-dark' : 'hover:bg-cream-dark/50'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: u.avatarColor }}
                  >
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-charcoal text-sm">{u.displayName}</p>
                    <p className="text-xs text-gray">@{u.username}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-charcoal border-charcoal'
                        : 'border-border'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-cream" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create button */}
        <div className="p-4">
          <button
            onClick={handleCreateGroup}
            disabled={selectedUsers.length === 0 || !groupName.trim() || isCreating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-charcoal text-cream rounded-xl
                     font-medium hover:bg-charcoal-light transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
            ) : (
              <>
                <Users className="w-5 h-5" />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
