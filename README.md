
# Banking Events System (Kafka + Node + Next)

## Setup

1) Infra (Kafka + ZK)
```
docker compose up -d
```

2) Backend
```
npm run orchestrator
npm run api
npm run gateway
```

3) Frontend
```
npm run dev
```

Open http://localhost:3000
