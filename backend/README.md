
# Backend (Node.js)

Servicios:
- `api.js`: POST /transactions -> produce a `txn.TransactionInitiated` to `txn.commands`
- `orchestrator.js`: consume `txn.commands` and emit events to `txn.events` / errors to `txn.dlq`
- `gateway.js`: consume `txn.events` and push to WebSocket clients

## Env
Create `backend/.env`:

KAFKA_BROKERS=localhost:9092
API_PORT=3001
GATEWAY_PORT=4000

## Run
- `npm run api`
- `npm run orchestrator`
- `npm run gateway`
