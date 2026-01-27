import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ArrowLeft, Users, MessageSquare, MessagesSquare, Activity, Database, Zap } from 'lucide-react';

interface AdminPageProps {
  onBack: () => void;
}

export function AdminPage({ onBack }: AdminPageProps) {
  const stats = useQuery((api as any).admin.getStats);

  if (!stats) {
    return (
      <div className="min-h-full bg-cream flex items-center justify-center">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-red rounded-full animate-pulse" />
          <div className="w-3 h-3 bg-charcoal rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-red rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  const maxMessages = Math.max(...stats.messagesPerDay.map((d: any) => d.count), 1);

  return (
    <div className="min-h-full bg-cream">
      {/* Header */}
      <header className="bg-charcoal text-cream p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red rounded-full" />
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Users"
            value={stats.totalUsers}
            subValue={`${stats.onlineUsers} online`}
            color="bg-blue-500"
          />
          <StatCard
            icon={<MessagesSquare className="w-5 h-5" />}
            label="Conversations"
            value={stats.totalConversations}
            subValue={`${stats.groupChats} groups`}
            color="bg-purple-500"
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5" />}
            label="Messages"
            value={stats.totalMessages}
            subValue="all time"
            color="bg-red"
          />
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            label="Active Sessions"
            value={stats.activeSessions}
            subValue="logged in"
            color="bg-green-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Messages Chart */}
          <div className="bg-white rounded-2xl p-6 border border-border">
            <h3 className="font-semibold text-charcoal mb-4">Messages (Last 7 Days)</h3>
            <div className="flex items-end gap-2 h-40">
              {stats.messagesPerDay.map((day: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-red/20 rounded-t-lg relative overflow-hidden"
                    style={{ height: `${Math.max((day.count / maxMessages) * 100, 5)}%` }}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-red transition-all duration-500"
                      style={{ height: '100%' }}
                    />
                  </div>
                  <span className="text-xs text-gray">{day.date}</span>
                  <span className="text-xs font-medium text-charcoal">{day.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Activity */}
          <div className="bg-white rounded-2xl p-6 border border-border">
            <h3 className="font-semibold text-charcoal mb-4">Top Active Users</h3>
            <div className="space-y-3">
              {stats.userMessageCounts.map((user: any, i: number) => {
                const maxUserMessages = Math.max(...stats.userMessageCounts.map((u: any) => u.count), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-charcoal text-cream flex items-center justify-center text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-charcoal">{user.name}</span>
                        <span className="text-xs text-gray">{user.count} msgs</span>
                      </div>
                      <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red rounded-full transition-all duration-500"
                          style={{ width: `${(user.count / maxUserMessages) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {stats.userMessageCounts.length === 0 && (
                <p className="text-gray text-sm text-center py-4">No activity yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="bg-white rounded-2xl p-6 border border-border">
          <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Convex Usage (Estimates)
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <UsageBar
              label={stats.convexLimits.database.label}
              used={stats.convexLimits.database.used}
              limit={stats.convexLimits.database.limit}
              icon={<Database className="w-4 h-4" />}
            />
            <UsageBar
              label={stats.convexLimits.bandwidth.label}
              used={stats.convexLimits.bandwidth.used}
              limit={stats.convexLimits.bandwidth.limit}
              icon={<Zap className="w-4 h-4" />}
            />
            <UsageBar
              label={stats.convexLimits.functions.label}
              used={stats.convexLimits.functions.used}
              limit={stats.convexLimits.functions.limit}
              icon={<Activity className="w-4 h-4" />}
            />
          </div>
          <p className="text-xs text-gray mt-4">
            * These are estimates based on current data. Check Convex dashboard for accurate usage.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-border text-center">
            <p className="text-2xl font-bold text-charcoal">{stats.directChats}</p>
            <p className="text-sm text-gray">Direct Chats</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-border text-center">
            <p className="text-2xl font-bold text-charcoal">{stats.groupChats}</p>
            <p className="text-sm text-gray">Group Chats</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-border text-center">
            <p className="text-2xl font-bold text-charcoal">
              {stats.totalMessages > 0
                ? Math.round(stats.totalMessages / Math.max(stats.totalConversations, 1))
                : 0}
            </p>
            <p className="text-sm text-gray">Avg Msgs/Chat</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray text-xs">
        Made by @Yashas.VM
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-charcoal">{value.toLocaleString()}</p>
      <p className="text-sm text-gray">{label}</p>
      <p className="text-xs text-gray-light mt-1">{subValue}</p>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
  icon,
}: {
  label: string;
  used: number;
  limit: number;
  icon: React.ReactNode;
}) {
  const percentage = Math.min((used / limit) * 100, 100);
  const getColor = () => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-charcoal flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="text-xs text-gray">{percentage.toFixed(2)}%</span>
      </div>
      <div className="h-3 bg-cream-dark rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray mt-1">
        {used.toLocaleString()} / {limit.toLocaleString()}
      </p>
    </div>
  );
}
