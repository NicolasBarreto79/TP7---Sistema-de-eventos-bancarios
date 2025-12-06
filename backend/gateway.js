import { WebSocketServer } from "ws";
import dotenv from "dotenv";
dotenv.config();

import { connectKafka, createConsumer } from "./common/kafkaClient.js";

await connectKafka();

const port = process.env.GATEWAY_PORT || 4000;
const wss = new WebSocketServer({ port });
const clients = new Map(); // ws -> { transactionId?, userId? }

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "subscribe") {
        clients.set(ws, { transactionId: data.transactionId, userId: data.userId });
        ws.send(JSON.stringify({ type: "info", data: "subscribed" }));
        console.log(`Client subscribed to tx=${data.transactionId || "-"} user=${data.userId || "-"}`);
      }
    } catch {
      ws.send(JSON.stringify({ type: "error", error: "invalid message" }));
    }
  });
  ws.on("close", () => clients.delete(ws));
});

// Consumer con groupId propio para el gateway
const consumer = createConsumer("gateway-consumer");
await consumer.connect();
await consumer.subscribe({ topic: "txn.events", fromBeginning: false });

consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());
    for (const [ws, sub] of clients.entries()) {
      if (sub.transactionId && sub.transactionId === event.transactionId) {
        ws.send(JSON.stringify({ type: "event", data: event }));
      } else if (!sub.transactionId && sub.userId && sub.userId === event.userId) {
        ws.send(JSON.stringify({ type: "event", data: event }));
      }
    }
  }
});

console.log(`WebSocket Gateway running on ws://localhost:${port}`);
