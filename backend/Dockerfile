# stage 1 build stage
FROM node:20-alpine AS build
#working directory
WORKDIR /app
#copy package.json and package-lock.json
COPY package*.json /app/
#install dependencies
RUN npm ci

#stage 2 runtime stage
FROM node:20-alpine AS runtime
#working directory
WORKDIR /app
#copy node_modules from build stage
COPY --from=build /app/node_modules /app/node_modules
#copy source code
COPY . .
#expose port
EXPOSE 5000
#start the application
CMD ["node", "index.js"]
