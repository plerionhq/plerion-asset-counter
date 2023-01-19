FROM node:16-alpine

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY AWS ./AWS
COPY index.js ./
COPY constants.js ./

ENTRYPOINT ["node", "index.js"]
