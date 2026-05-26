'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { FleetAgent } from '@/lib/types';

function formatDate(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' });
}

function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function AgentCard({ agent }: { agent: FleetAgent }) {
  const summary =
    agent.summary.length > 80 ? agent.summary.slice(0, 80) + '...' : agent.summary;

  return (
    <div
      className="p-4 rounded border border-[#2A2D35] bg-[#1A1D23] transition-all duration-150 hover:border-[#4B9FFF] hover:shadow-[0_0_12px_rgba(75,159,255,0.15)] hover:-translate-y-0.5 cursor-default"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-sm font-semibold text-[#E8EAF0]">
          {toTitleCase(agent.agentName)}
        </span>
        <span className="font-mono text-[10px] text-[#4B9FFF] bg-[#4B9FFF15] border border-[#4B9FFF30] px-1.5 py-0.5 rounded whitespace-nowrap">
          {agent.model}
        </span>
      </div>
      {summary && (
        <p className="font-mono text-xs text-[#8B8FA8] mb-3 leading-relaxed">{summary}</p>
      )}
      <div className="flex items-center gap-3 text-[10px] font-mono text-[#555870]">
        <span>{agent.runCount} run{agent.runCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>last: {formatDate(agent.lastUsed)}</span>
      </div>
    </div>
  );
}

function NewAgentModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.tasks.create({
        title: 'New agent request',
        body: text.trim(),
        state: 'lane',
        urgency: 'normal',
        domain: 'agent-build',
      });
      toast('Request sent to L&S.');
      onClose();
    } catch {
      toast('Failed to submit request. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1A1D23] border border-[#2A2D35] rounded-lg p-6 w-full max-w-lg shadow-2xl">
        <h2 className="font-mono text-sm font-bold text-[#E8EAF0] tracking-widest uppercase mb-1">
          Request New Agent
        </h2>
        <p className="font-mono text-xs text-[#8B8FA8] mb-4">
          Describe the gap. L&S will evaluate.
        </p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="What specialist capability is missing? What tasks would this agent handle?"
          className="w-full bg-[#12151A] border border-[#2A2D35] rounded p-3 font-mono text-xs text-[#E8EAF0] placeholder:text-[#555870] resize-none focus:outline-none focus:border-[#4B9FFF]"
        />
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="font-mono text-xs text-[#8B8FA8] hover:text-[#E8EAF0] transition-colors px-3 py-2"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className="font-mono text-xs font-semibold px-4 py-2 rounded border border-[#4B9FFF] text-[#4B9FFF] hover:bg-[#4B9FFF] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'SENDING...' : 'SUBMIT REQUEST'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FleetPanel() {
  const [agents, setAgents] = useState<FleetAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.fleet
      .list()
      .then((res) => setAgents(res.agents))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-[#2A2D35]"
        style={{ backgroundColor: '#0D1017' }}
      >
        <div>
          <h2 className="font-mono text-xs font-bold text-[#E8EAF0] tracking-[0.2em] uppercase">
            Fleet
          </h2>
          <p className="font-mono text-[10px] text-[#555870] mt-0.5">
            {loading ? 'Scanning...' : `${agents.length} agent${agents.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="font-mono text-xs text-[#555870] animate-pulse">SCANNING FLEET...</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#2A2D35] flex items-center justify-center">
              <span className="text-[#555870] text-lg">?</span>
            </div>
            <p className="font-mono text-xs text-[#8B8FA8] max-w-sm">
              Fleet definitions not mounted. Add /fleet/agents bind mount to Docker.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {agents.map((agent) => (
              <AgentCard key={agent.agentName} agent={agent} />
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-[#2A2D35]">
        <button
          onClick={() => setShowModal(true)}
          className="font-mono text-xs font-semibold text-[#4B9FFF] border border-[#4B9FFF30] rounded px-4 py-2 hover:border-[#4B9FFF] hover:bg-[#4B9FFF10] transition-colors"
        >
          + Request New Agent
        </button>
      </div>

      {showModal && <NewAgentModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
