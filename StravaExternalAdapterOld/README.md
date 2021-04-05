cd StravaExternalAdapter
yarn
yarn start
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "user": "Tanner", "timestamp": "2020-03-15" } }'