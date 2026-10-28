#use the official node.js image as our base 
FROM node:18

#set the working directory inside the container
WORKDIR /usr/src/app

#copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./ 

#install app dependencies
RUN npm install

#Copy the rest of our app's source code into the container
COPY . .

#Expose the port the app will run on
EXPOSE 5001

#The commmand to run our app
CMD ["npm", "run", "dev"]

