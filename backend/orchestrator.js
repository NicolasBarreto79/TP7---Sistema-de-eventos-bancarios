import { connectKafka, createConsumer, producer } from "./common/kafkaClient.js";
import { ensureTopics } from "./common/createTopics.js";
import { buildEvent } from "./common/eventEnvelope.js";

await connectKafka();
await ensureTopics();

// Consumer con groupId propio para este servicio
const consumer = createConsumer("orchestrator-consumer");
await consumer.connect();
await consumer.subscribe({ topic: "txn.commands", fromBeginning: false });

consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());
    const { transactionId, userId, payload } = event;

    if (event.type !== "txn.TransactionInitiated") return;
    console.log("Orchestrator received:", transactionId);

    // 1) Reservar fondos
    const fundsEvent = buildEvent(
      "txn.FundsReserved",
      transactionId,
      userId,
      { ok: true, holdId: "HOLD-" + Math.floor(Math.random() * 10000), amount: payload.amount }
    );
    await producer.send({ topic: "txn.events", messages: [{ key: transactionId, value: JSON.stringify(fundsEvent) }] });

    // 2) Antifraude simulado
    const risk = Math.random() > 0.3 ? "LOW" : "HIGH";
    const fraudEvent = buildEvent("txn.FraudChecked", transactionId, userId, { risk });
    await producer.send({ topic: "txn.events", messages: [{ key: transactionId, value: JSON.stringify(fraudEvent) }] });

    // 3) Commit / Reverse
    if (risk === "LOW") {
      const committed = buildEvent("txn.Committed", transactionId, userId, { ledgerTxId: "LEDGER-" + Math.floor(Math.random() * 100000) });
      const notified  = buildEvent("txn.Notified",  transactionId, userId, { channels: ["email"] });
      await producer.send({
        topic: "txn.events",
        messages: [
          { key: transactionId, value: JSON.stringify(committed) },
          { key: transactionId, value: JSON.stringify(notified) }
        ]
      });
    } else {
      const reversed = buildEvent("txn.Reversed", transactionId, userId, { reason: "FraudHigh" });
      await producer.send({ topic: "txn.events", messages: [{ key: transactionId, value: JSON.stringify(reversed) }] });
    }
  }
});
