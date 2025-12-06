import { kafka } from "./kafkaClient.js";

export async function ensureTopics() {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: [
      { topic: "txn.commands", numPartitions: 1, replicationFactor: 1 },
      { topic: "txn.events",   numPartitions: 1, replicationFactor: 1 },
      { topic: "txn.dlq",      numPartitions: 1, replicationFactor: 1 }
    ],
    waitForLeaders: true,
  });
  await admin.disconnect();
  console.log("Topics OK: txn.commands, txn.events, txn.dlq");
}
