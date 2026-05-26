'use client';

import { useState } from 'react';
import { CommandStrip } from '@/components/CommandStrip';
import { TaskInbox } from '@/components/TaskInbox';
import { AgentQueue } from '@/components/AgentQueue';
import { ShellProvider } from '@/components/ShellProvider';
import { FleetPanel } from '@/components/FleetPanel';
import { CommandPalette } from '@/components/CommandPalette';

type Tab = 'operations' | 'fleet';

const TABS: { id: Tab; label: string }[] = [
  { id: 'operations', label: 'OPERATIONS' },
  { id: 'fleet', label: 'FLEET' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('operations');

  return (
    <ShellProvider>
      <div
        className="flex flex-col h-screen min-w-[1280px]"
        style={{ backgroundColor: '#12151A' }}
      >
        {/* Top command strip */}
        <CommandStrip />

        {/* Tab bar */}
        <nav
          className="flex items-center gap-1 px-6 border-b border-[#2A2D35]"
          style={{ backgroundColor: '#0D1017' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'font-mono text-[11px] font-semibold tracking-[0.18em] uppercase px-4 py-3 border-b-2 transition-colors',
                  isActive
                    ? 'border-[#4B9FFF] text-[#4B9FFF]'
                    : 'border-transparent text-[#555870] hover:text-[#8B8FA8]',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Panel content */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === 'operations' ? (
            <>
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
            </>
          ) : (
            <div className="w-full overflow-hidden" style={{ backgroundColor: '#1C2028' }}>
              <FleetPanel />
            </div>
          )}
        </div>

        {/* Cmd+K palette mounted at page root */}
        <CommandPalette />
      </div>
    </ShellProvider>
  );
}
