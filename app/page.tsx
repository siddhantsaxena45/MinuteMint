'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

type SummarizeResponse = {
  summary?: string;
  action_items?: string[];
  decisions?: string[];
  follow_ups?: string[];
  risks?: string[];
};

export default function HomePage() {
  const [transcript, setTranscript] = useState('');
  const [instruction, setInstruction] = useState('Summarize in bullet points for executives.');
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [decisions, setDecisions] = useState('');
  const [followUps, setFollowUps] = useState('');
  const [risks, setRisks] = useState('');
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const summarizeAbortRef = useRef<AbortController | null>(null);

  const transcriptChars = transcript.length;
  const canSummarize = useMemo(
    () => transcript.trim().length > 0 && !loading,
    [transcript, loading]
  );

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function isEmail(s: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function parseRecipients(input: string): string[] {
    return input
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const fileInput = (e.currentTarget.elements.namedItem('file') as HTMLInputElement) || null;
      const file = fileInput?.files?.[0];
      if (!file) return notify('Select a .txt file to upload');

      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        try {
          const b = await res.json();
          return notify(`Upload failed: ${b?.error || res.statusText}`);
        } catch {
          return notify(`Upload failed (${res.status})`);
        }
      }
      const data = await res.json();
      setTranscript(data.text || '');
      notify('Transcript loaded');
    } catch (err: any) {
      notify(`Upload error: ${err?.message || 'Unknown error'}`);
    }
  }

  const onSummarize = useCallback(async () => {
    if (!transcript.trim()) return notify('Please upload or paste a transcript first.');
    if (loading) return;

    setLoading(true);
    summarizeAbortRef.current?.abort();
    summarizeAbortRef.current = new AbortController();

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript, instruction }),
        signal: summarizeAbortRef.current.signal,
      });
      if (!res.ok) {
        try {
          const b = await res.json();
          throw new Error(b?.error || 'Summarize failed');
        } catch {
          throw new Error(`Summarize failed (${res.status})`);
        }
      }
      const data = (await res.json()) as SummarizeResponse;
      setSummary(data.summary || '');
      setActionItems((data.action_items || []).map(x => `- ${x}`).join('\n'));
      setDecisions((data.decisions || []).map(x => `- ${x}`).join('\n'));
      setFollowUps((data.follow_ups || []).map(x => `- ${x}`).join('\n'));
      setRisks((data.risks || []).map(x => `- ${x}`).join('\n'));
      notify('Summary generated');
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      notify(e?.message || 'Error generating summary');
    } finally {
      setLoading(false);
      summarizeAbortRef.current = null;
    }
  }, [transcript, instruction, loading]);

  async function onEmail() {
    const recipients = parseRecipients(emails);
    if (recipients.length === 0) return notify('Enter at least one recipient email');
    if (!recipients.every(isEmail)) return notify('One or more recipient emails are invalid');

    if (emailSending) return;
    setEmailSending(true);

    const subject = 'Meeting Summary';
    // Start with simple content for deliverability
    const text = [
      `Summary:\n${summary}`,
      `\nAction Items:\n${actionItems}`,
      `\nDecisions:\n${decisions}`,
      `\nFollow Ups:\n${followUps}`,
      `\nRisks:\n${risks}`,
    ].join('\n');

    const html = `
      <h2>Summary</h2><pre>${escapeHtml(summary)}</pre>
      <h3>Action Items</h3><pre>${escapeHtml(actionItems)}</pre>
      <h3>Decisions</h3><pre>${escapeHtml(decisions)}</pre>
      <h3>Follow Ups</h3><pre>${escapeHtml(followUps)}</pre>
      <h3>Risks</h3><pre>${escapeHtml(risks)}</pre>
    `;

    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipients, subject, text, html }),
      });

      if (!res.ok) {
        // Surface server error to UI
        let msg = `Email failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) msg += `: ${body.error}`;
        } catch {}
        return notify(msg);
      }

      notify('Email sent');
    } catch (err: any) {
      notify(`Email request error: ${err?.message || 'Unknown error'}`);
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '20px auto', padding: 12 }}>
      <h1>AI Meeting Notes Summarizer</h1>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="toast"
        >
          {toast}
        </div>
      )}

      {/* Upload */}
      <section style={{ marginTop: 20 }}>
        <h2>1) Upload Transcript (.txt)</h2>
        <form onSubmit={onUpload}>
          <input name="file" type="file" accept=".txt" />
          <button type="submit" style={{ marginLeft: 10 }}>Upload</button>
        </form>

        <p style={{ marginTop: 8 }}>Or paste text directly:</p>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          rows={8}
          style={{ width: '100%', fontFamily: 'monospace' }}
          placeholder="Paste transcript here..."
        />
        <div className="char-count">
          {transcriptChars.toLocaleString()} chars
        </div>
      </section>

      {/* Instruction */}
      <section style={{ marginTop: 20 }}>
        <h2>2) Instruction</h2>
        <input
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          style={{ width: '100%' }}
          placeholder='e.g., "Summarize in bullet points for executives"'
        />
        <button
          disabled={!canSummarize}
          onClick={onSummarize}
          style={{ marginTop: 10 }}
        >
          {loading ? 'Generating…' : 'Generate Summary'}
        </button>
      </section>

      {/* Editable Outputs */}
      <section style={{ marginTop: 20 }}>
        <h2>3) Edit Summary</h2>

        <label>Summary</label>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          rows={6}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />

        <label>Action Items</label>
        <textarea
          value={actionItems}
          onChange={e => setActionItems(e.target.value)}
          rows={6}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />

        <label>Decisions</label>
        <textarea
          value={decisions}
          onChange={e => setDecisions(e.target.value)}
          rows={6}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />

        <label>Follow Ups</label>
        <textarea
          value={followUps}
          onChange={e => setFollowUps(e.target.value)}
          rows={6}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />

        <label>Risks</label>
        <textarea
          value={risks}
          onChange={e => setRisks(e.target.value)}
          rows={6}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />
      </section>

      {/* Email */}
      <section style={{ marginTop: 20 }}>
        <h2>4) Share via Email</h2>
        <input
          value={emails}
          onChange={e => setEmails(e.target.value)}
          style={{ width: '100%' }}
          placeholder="recipient1@example.com, recipient2@example.com"
        />
        <button
          onClick={onEmail}
          style={{ marginTop: 10 }}
          disabled={emailSending}
        >
          {emailSending ? 'Sending…' : 'Send Email'}
        </button>
        <p className="tip">
          Tip: separate multiple emails with commas.
        </p>
      </section>
    </main>
  );
}

function escapeHtml(s: string) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
