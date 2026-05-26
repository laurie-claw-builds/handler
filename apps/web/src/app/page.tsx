import { CommandStrip } from '@/components/CommandStrip';
import { TaskInbox } from '@/components/TaskInbox';
import { AgentQueue } from '@/components/AgentQueue';

export default function HomePage() {
  return (
    <div
      className="flex flex-col h-screen min-w-[1280px]"
      style={{ backgroundColor: '#12151A' }}
    >
      {/* Top command strip */}
      <CommandStrip />

      {/* Main content: two-panel split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Task Inbox (60%) */}
        <div
          className="w-[60%] border-r border-border overflow-hidden"
          style={{ backgroundColor: '#1C2028' }}
        >
          <TaskInbox />
        </div>

        {/* Right: Agent Queue (40%) */}
        <div
          className="w-[40%] overflow-hidden"
          style={{ backgroundColor: '#1C2028' }}
        >
          <AgentQueue />
        </div>
      </div>
    </div>
  );
}
