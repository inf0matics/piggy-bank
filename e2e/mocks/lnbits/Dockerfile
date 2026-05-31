# Minimal image for the LNBits mock. No dependencies, no build step.
FROM node:22-slim

WORKDIR /app
COPY server.mjs .

# Served on port 80 inside the Docker network (app reaches it at http://lnbits-mock).
EXPOSE 80

HEALTHCHECK --interval=2s --timeout=2s --retries=30 \
  CMD node -e "fetch('http://localhost:80/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.mjs"]
