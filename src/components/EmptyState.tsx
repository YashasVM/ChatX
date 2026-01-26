import { MessageCircle } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center bg-cream p-8">
      <div className="text-center max-w-sm">
        {/* Bauhaus-inspired decorative element */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-cream-dark rounded-full" />
          <div className="absolute top-4 left-4 w-12 h-12 bg-red rounded-full opacity-80" />
          <div className="absolute bottom-4 right-4 w-8 h-8 bg-charcoal rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <MessageCircle className="w-10 h-10 text-gray" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-charcoal mb-2">
          Select a conversation
        </h2>
        <p className="text-gray">
          Choose an existing chat from the sidebar or start a new conversation
        </p>
      </div>
    </div>
  );
}
