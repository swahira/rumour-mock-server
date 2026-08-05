#!/bin/bash
node server.js &
SERVER_PID=$!
sleep 2

echo "Testing GET /get"
curl -s http://localhost:4000/get | grep '"url"'

echo "Testing POST /post"
curl -s -X POST http://localhost:4000/post | grep '"url"'

echo "Testing GET /response-headers"
curl -s -I "http://localhost:4000/response-headers?X-Custom-Header=Hello" | grep 'X-Custom-Header'

kill $SERVER_PID
echo "Done"
