import dotenv from "dotenv";
dotenv.config(); // busca backend/.env cuando corrés parado en /backend

import { Kafka, Partitioners } from "kafkajs";

const brokersRaw = process.env.KAFKA_BROKERS;
if (!brokersRaw) {
  console.error("KAFKA_BROKERS is undefined. Set it in backend/.env");
  process.exit(1);
}
const brokers = brokersRaw.split(",").map(s => s.trim());

export const kafka = new Kafka({
  clientId: "banking-events",
  brokers
});

// Producer con particionador legacy (evita warning de v2)
export const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

// Factory para crear consumers con groupId propio (por servicio)
export function createConsumer(groupId) {
  return kafka.consumer({ groupId });
}

export async function connectKafka() {
  await producer.connect();
  console.log("Kafka connected to", brokers.join(", "));
}
