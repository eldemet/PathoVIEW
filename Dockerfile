FROM node:lts-buster as build-stage

RUN npm i -g aurelia-cli
RUN mkdir -p /usr/app/client
WORKDIR /usr/app/client

COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:lts-buster as production-stage

# Create app directory
RUN mkdir -p /usr/app/server
WORKDIR /usr/app/server

# copy server
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# copy client
COPY --from=build-stage /usr/app/client/dist /usr/app/server/client

# copy data
# COPY data/ /usr/app/data

EXPOSE 3002
CMD [ "npm", "start" ]
