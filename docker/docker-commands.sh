#!/usr/bin/sh
docker build . -t edvdf:node;
docker run -it --name node edvdf:node;
docker rm -f node;
docker exec -it node /bin/sh -c "cd /usr/src/app; npm start:node";

docker run -it -d -p 8545:8545 --name node edvdf:node;
docker exec -it node /bin/sh -c "cd /usr/src/app; npm start:tester";
docker logs node;