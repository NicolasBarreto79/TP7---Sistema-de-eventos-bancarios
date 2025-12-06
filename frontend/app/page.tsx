
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type EventEnvelope<T=any> = {
  id: string;
  type: string;
  version: number;
  ts: number;
  transactionId: string;
  userId: string;
  payload: T;
  correlationId?: string;
};

export default function Page() {
  const [userId, setUserId] = useState('user-123');
  const [fromAccount, setFrom] = useState('ACC-001');
  const [toAccount, setTo] = useState('ACC-002');
  const [amount, setAmount] = useState(100);
  const [currency, setCurrency] = useState('USD');
  const [txId, setTxId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const WS = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

  const startWS = (transactionId: string) => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(WS);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', transactionId }));
    };
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.type === 'event') setEvents(prev => [...prev, msg.data]);
    };
    wsRef.current = ws;
  };

  const initiate = async () => {
    setEvents([]);
    const res = await fetch(`${API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromAccount, toAccount, amount, currency, userId })
    });
    const data = await res.json();
    setTxId(data.transactionId);
    startWS(data.transactionId);
  };

  const status = useMemo(() => txId ? `TX ${txId.slice(0,8)}…` : 'Sin transacción', [txId]);

  return (
    <div className="container space-y-6">
      <h1 className="text-2xl font-semibold">Banking Events System</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h2 className="font-medium">New Transaction</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="input col-span-2" placeholder="User ID" value={userId} onChange={e=>setUserId(e.target.value)} />
            <input className="input" placeholder="From Account" value={fromAccount} onChange={e=>setFrom(e.target.value)} />
            <input className="input" placeholder="To Account" value={toAccount} onChange={e=>setTo(e.target.value)} />
            <input className="input" type="number" placeholder="Amount" value={amount} onChange={e=>setAmount(parseFloat(e.target.value))} />
            <input className="input" placeholder="Currency" value={currency} onChange={e=>setCurrency(e.target.value)} />
          </div>
          <button className="btn" onClick={initiate}>Initiate Transaction</button>
          <div className="text-sm opacity-70">Estado: {status}</div>
        </div>
        <div className="card">
          <h2 className="font-medium mb-3">Transaction Timeline</h2>
          {events.length === 0 ? (
            <div className="opacity-60">No events yet…</div>
          ) : (
            <ul className="space-y-2">
              {events.map(ev => (
                <li key={ev.id} className="border border-neutral-800 rounded p-3">
                  <div className="text-sm opacity-70">{new Date(ev.ts).toLocaleTimeString()}</div>
                  <div className="font-mono">{ev.type}</div>
                  <pre className="text-xs opacity-80 overflow-auto">{JSON.stringify(ev.payload, null, 2)}</pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="text-xs opacity-60">
        API: {API} · WS: {WS}
      </div>
    </div>
  );
}
