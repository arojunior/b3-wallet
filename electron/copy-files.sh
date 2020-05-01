#!/bin/bash
rm -rf ./src/client
rm -rf ./src/server

cp -R ../client/build ./src/client

mkdir -p ./src/server
mkdir -p ./src/server/data
cp -R ../server/src ./src/server/src
cp -R ../server/data ./src/server/data

yarn add axios puppeteer@2.1.1 socket.io


 