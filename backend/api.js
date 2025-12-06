import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { connectKafka, producer } from "./common/kafkaClient.js";
import { buildEvent } from "./common/eventEnvelope.js";

const app = express();

// Habilitar CORS para permitir llamadas desde http://localhost:3000
app.use(cors());

// Body parser JSON
app.use(express.json());

// Conexión a Kafka
await connectKafka();

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

// POST /transactions -> publica txn.TransactionInitiated en txn.commands
app.post("/transactions", async (req, res) => {
  try {
    const transactionId = uuidv4();
    const { fromAccount, toAccount, amount, currency, userId, description } = req.body || {};

    if (!fromAccount || !toAccount || !amount || !currency || !userId) {
      return res.status(400).json({
        error: "Missing required fields: fromAccount, toAccount, amount, currency, userId",
      });
    }

    const event = buildEvent("txn.TransactionInitiated", transactionId, userId, {
      fromAccount,
      toAccount,
      amount,
      currency,
      userId,
      description,
    });

    await producer.send({
      topic: "txn.commands",
      messages: [{ key: transactionId, value: JSON.stringify(event) }],
    });

    console.log("Produced:", event.type, "tx:", transactionId);
    return res.status(202).json({ transactionId, status: "INITIATED" });
  } catch (err) {
    console.error("Error in /transactions:", err);
    return res.status(500).json({ error: "Internal error producing command" });
  }
});

// Puerto
const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
