FROM node:22-alpine
WORKDIR /app
RUN mkdir -p /home/node/.config/aradhyac/algorithms && chown -R node:node /home/node
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
