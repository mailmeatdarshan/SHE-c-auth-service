# use the official node.js image as our base 
FROM node:26-alpine

# set the working directory inside the container
WORKDIR /usr/src/app

# copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./ 

# install app dependencies with locked versions and ignore scripts
RUN npm ci --ignore-scripts

# Copy the app source code into the container
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node tsconfig*.json ./

USER node

# Expose the port the app will run on
EXPOSE 5001

# The command to run our app
CMD ["npm", "run", "dev"]


