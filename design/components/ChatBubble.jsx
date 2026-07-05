import React from 'react';

/*
 * ChatBubble — coach/student message bubble for the AI-coach panel and
 * mock-interview transcript.
 */
export function ChatBubble({ from = 'coach', children }) {
  const isStudent = from === 'student';
  return (
    <div style={{ display: 'flex', gap: 10, flexDirection: isStudent ? 'row-reverse' : 'row' }}>
      <div style={{
        maxWidth: '78%', padding: '11px 16px', fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap',
        borderRadius: 16,
        borderTopLeftRadius: isStudent ? 16 : 4,
        borderTopRightRadius: isStudent ? 4 : 16,
        fontFamily: 'var(--font-body-clean)',
        background: isStudent ? 'var(--c-black)' : 'var(--surface-sunk)',
        color: isStudent ? '#fff' : 'var(--text-primary)',
      }}>
        {children}
      </div>
    </div>
  );
}
