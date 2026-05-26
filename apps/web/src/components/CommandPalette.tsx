'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { FleetAgent } from '@/lib/types';

type PaletteMode = 'navigate' | 'dispatch-agent' | 'dispatch-brief';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PaletteMode>('navigate');
  const [query, setQuery] = useState('');
  const [agents, setAgents] = useState<FleetAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<FleetAgent | null>(null);
  const [brief, setBrief] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const briefRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setMode('navigate');
      setQuery('');
      setSelectedAgent(null);
      setBrief('');
    }
  }, [open]);

  // Fetch fleet on open
  useEffect(() => {
    if (open && agents.length === 0) {
      api.fleet
        .list()
        .then((res) => setAgents(res.agents))
        .catch(() => {});
    }
  }, [open, agents.length]);

  // Focus brief textarea when switching to brief mode
  useEffect(() => {
    if (mode === 'dispatch-brief') {
      setTimeout(() => briefRef.current?.focus(), 50);
    }
  }, [mode]);

  const handleSelectDispatch = useCallback(() => {
    setMode('dispatch-agent');
    setQuery('');
  }, []);

  const handleSelectAgent = useCallback((agent: FleetAgent) => {
    setSelectedAgent(agent);
    setMode('dispatch-brief');
  }, []);

  const handleDispatch = useCallback(async () => {
    if (!selectedAgent || !brief.trim()) return;
    setSubmitting(true);
    try {
      await api.agentJobs.create({
        agentName: selectedAgent.agentName,
        model: selectedAgent.model ?? 'claude-sonnet-4-6',
        brief: brief.trim(),
      });
      setOpen(false);
      toast('Agent dispatched.');
    } catch {
      toast('Dispatch failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedAgent, brief]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-[#2A2D35] shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#1A1D23' }}
      >
        {mode === 'navigate' && (
          <Command className="w-full" shouldFilter={true}>
            <div className="flex items-center border-b border-[#2A2D35] px-4">
              <span className="font-mono text-xs text-[#555870] mr-2">CMD</span>
              <Command.Input
                autoFocus
                placeholder="Search or type 'dispatch'..."
                value={query}
                onValueChange={setQuery}
                className="w-full bg-transparent py-4 font-mono text-sm text-[#E8EAF0] placeholder:text-[#555870] focus:outline-none"
              />
            </div>
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty>
                <span className="font-mono text-xs text-[#555870] px-4 py-6 block text-center">
                  No results.
                </span>
              </Command.Empty>

              <Command.Group
                heading={
                  <span className="font-mono text-[10px] text-[#555870] tracking-widest uppercase px-2 py-1 block">
                    Actions
                  </span>
                }
              >
                <Command.Item
                  value="dispatch agent"
                  onSelect={handleSelectDispatch}
                  className="flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer font-mono text-sm text-[#E8EAF0] data-[selected=true]:bg-[#4B9FFF20] data-[selected=true]:text-[#4B9FFF]"
                >
                  <span className="text-[#4B9FFF] text-base">+</span>
                  Dispatch Agent
                </Command.Item>
              </Command.Group>

              <Command.Group
                heading={
                  <span className="font-mono text-[10px] text-[#555870] tracking-widest uppercase px-2 py-1 block">
                    Navigate
                  </span>
                }
              >
                <Command.Item
                  value="navigate operations"
                  className="flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer font-mono text-sm text-[#8B8FA8] data-[selected=true]:bg-[#2A2D35]"
                  disabled
                >
                  Operations — coming soon
                </Command.Item>
              </Command.Group>
            </Command.List>

            <div className="border-t border-[#2A2D35] px-4 py-2 flex items-center gap-4">
              <span className="font-mono text-[10px] text-[#555870]">
                <kbd className="bg-[#2A2D35] px-1 rounded">↑↓</kbd> navigate
              </span>
              <span className="font-mono text-[10px] text-[#555870]">
                <kbd className="bg-[#2A2D35] px-1 rounded">↵</kbd> select
              </span>
              <span className="font-mono text-[10px] text-[#555870]">
                <kbd className="bg-[#2A2D35] px-1 rounded">Esc</kbd> close
              </span>
            </div>
          </Command>
        )}

        {mode === 'dispatch-agent' && (
          <Command className="w-full" shouldFilter={true}>
            <div className="flex items-center border-b border-[#2A2D35] px-4">
              <span className="font-mono text-xs text-[#4B9FFF] mr-2">AGENT</span>
              <Command.Input
                autoFocus
                placeholder="Search agents..."
                value={query}
                onValueChange={setQuery}
                className="w-full bg-transparent py-4 font-mono text-sm text-[#E8EAF0] placeholder:text-[#555870] focus:outline-none"
              />
            </div>
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty>
                <span className="font-mono text-xs text-[#555870] px-4 py-6 block text-center">
                  {agents.length === 0 ? 'Loading fleet...' : 'No agents match.'}
                </span>
              </Command.Empty>

              {agents.map((agent) => (
                <Command.Item
                  key={agent.agentName}
                  value={`${agent.agentName} ${agent.title}`}
                  onSelect={() => handleSelectAgent(agent)}
                  className="flex items-start gap-3 px-3 py-2.5 rounded cursor-pointer data-[selected=true]:bg-[#4B9FFF20]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-[#E8EAF0] data-[selected=true]:text-[#4B9FFF]">
                      {agent.title}
                    </div>
                    <div className="font-mono text-xs text-[#555870] truncate">
                      {agent.summary.slice(0, 60)}
                      {agent.summary.length > 60 ? '...' : ''}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#4B9FFF] bg-[#4B9FFF15] px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap">
                    {agent.model.replace('claude-', '').split('-')[0]}
                  </span>
                </Command.Item>
              ))}
            </Command.List>

            <div className="border-t border-[#2A2D35] px-4 py-2">
              <button
                onClick={() => { setMode('navigate'); setQuery(''); }}
                className="font-mono text-[10px] text-[#555870] hover:text-[#8B8FA8] transition-colors"
              >
                ← Back
              </button>
            </div>
          </Command>
        )}

        {mode === 'dispatch-brief' && selectedAgent && (
          <div className="flex flex-col">
            <div className="flex items-center border-b border-[#2A2D35] px-4 py-3">
              <span className="font-mono text-xs text-[#4B9FFF] mr-2">BRIEF</span>
              <span className="font-mono text-sm text-[#E8EAF0]">{selectedAgent.title}</span>
              <span className="ml-auto font-mono text-[10px] text-[#555870]">{selectedAgent.model}</span>
            </div>

            <div className="p-4">
              <textarea
                ref={briefRef}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={6}
                placeholder="Write the agent brief..."
                className="w-full bg-[#12151A] border border-[#2A2D35] rounded p-3 font-mono text-sm text-[#E8EAF0] placeholder:text-[#555870] resize-none focus:outline-none focus:border-[#4B9FFF]"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleDispatch();
                  }
                }}
              />
            </div>

            <div className="border-t border-[#2A2D35] px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => { setMode('dispatch-agent'); setQuery(''); }}
                className="font-mono text-[10px] text-[#555870] hover:text-[#8B8FA8] transition-colors"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[#555870]">
                  <kbd className="bg-[#2A2D35] px-1 rounded">Cmd+Enter</kbd> dispatch
                </span>
                <button
                  onClick={handleDispatch}
                  disabled={submitting || !brief.trim()}
                  className="font-mono text-xs font-semibold px-4 py-2 rounded border border-[#4B9FFF] text-[#4B9FFF] hover:bg-[#4B9FFF] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'DISPATCHING...' : 'DISPATCH'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
