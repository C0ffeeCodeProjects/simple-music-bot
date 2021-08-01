FROM node:latest-alpine as build
LABEL intermediate=true
WORKDIR /build

COPY ["package.json", "package-lock.json" "./"]
RUN ["npm", "ci"]

COPY ["tsconfig.json", "./src", "./"]
RUN ["npm", "run", "build"]

FROM node:latest-alpine as final
WORKDIR /app

COPY --from=build ./dist .

ENTRYPOINT ["node", "./main.js"]
