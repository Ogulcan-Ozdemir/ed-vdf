FROM node:14-alpine
RUN apk add git;
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm install --production
# RUN yarn install --non-interactive --frozen-lockfile
COPY $PWD/docker/entrypoint.sh /usr/local/bin
ENTRYPOINT ["/bin/sh", "/usr/local/bin/entrypoint.sh"]