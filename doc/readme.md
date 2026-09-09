# 🚀 Tarefa: Migrar Rate Limit de Downloads para Upstash (Redis)

## 🎯 Objetivo

Substituir o gerenciamento de Rate Limit atual (que roda em memória RAM na Vercel e redefine o contador a cada ciclo de vida da Serverless Function) por uma solução centralizada usando **Upstash Redis**. Isso garantirá que o limite de 5 downloads por IP em 15 minutos seja exato e à prova de falhas/ataques.

---

## 📋 Checklist de Implementação

### 1. Infraestrutura (Painel Upstash)

- [ ] Criar conta no [Upstash](https://upstash.com) (via GitHub).
- [ ] Criar um novo banco de dados Redis (ex: `rate-limit-prod`).
- [ ] Selecionar a região mais próxima da Vercel (geralmente `us-east-1`).
- [ ] Copiar a string de conexão `REDIS_URL` (aba _Details_ > _Node.js_).

### 2. Configuração na Vercel

- [ ] Ir em _Settings_ > _Environment Variables_ no projeto da Vercel.
- [ ] Adicionar a variável ambiente:
  - **Key:** `REDIS_URL`
  - **Value:** `[Colar a string do Upstash]`
- [ ] Salvar a variável.

### 3. Alterações no Código Backend

- [ ] Instalar as dependências de conexão no projeto:
  ```bash
  npm install rate-limit-redis ioredis
  ```
- [ ] Atualizar o arquivo do middleware do Rate Limit para injetar o `RedisStore` e manter o tratamento correto do IP real vindo da Vercel (`x-forwarded-for`).
- [ ] Validar a ordem de chamada no `next-connect` (`^1.0.0`) usando a assinatura correta com `.use(downloadLimiter)`.

---

## 🛠️ Código de Referência Proposto

### `src/middlewares/downloadLimiter.js`

```javascript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

// Conecta ao Redis em produção ou tenta rodar local caso configurado
const redisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
);

export const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 5, // Limite estrito de 5 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,

  // Armazena as contagens no Redis de forma centralizada
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(args, ...args.slice(1)),
  }),

  // Captura o IP real do cliente atrás da Vercel/Cloudflare
  keyGenerator: (req) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    if (forwardedFor) {
      const ipString = Array.isArray(forwardedFor)
        ? forwardedFor
        : forwardedFor;
      return ipString.split(",")[0].trim();
    }
    return (
      req.headers["cf-connecting-ip"] || req.socket.remoteAddress || "unknown"
    );
  },

  handler: (req, res) => {
    return res.status(429).json({
      error: "Muitos Downloads requisitados. Tente novamente mais tarde.",
    });
  },
});
```

---

## 🧪 Critérios de Aceite (Testes)

- [ ] Fazer mais de 5 requisições seguidas em aba anônima e verificar se o erro `429` com a mensagem customizada aparece **exatamente na 6ª tentativa**.
- [ ] Verificar se as requisições em excesso estão sendo barradas diretamente no Redis sem causar gargalos ou erros de timeout na rota principal.
