FROM node:16.15.0

RUN apt-get update
RUN apt-get install -y curl

# RUN curl -sL https://deb.nodesource.com/setup_16.x | bash

RUN apt-get install -y nodejs

COPY package.json /app/
COPY package-lock.json /app/

WORKDIR /app/

RUN npm install

COPY . /app/

RUN cp -f /app/src/environments/environment.uhh.prod.ts /app/src/environments/environment.prod.ts

# RUN NODE_OPTIONS="--max-old-space-size=16384"

RUN npm run build -- --prod --base-href=/ --output-path=./dist/caddie

RUN cp -r dist/caddie/* /usr/share/nginx/html/

COPY nginx/default.conf /etc/nginx/conf.d/
COPY nginx/htpasswd /etc/nginx/htpasswd

EXPOSE 80
