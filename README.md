# apartment-service-backend

The backend of an apartment service web application

## Deploy the MongoDB replica set

### Enter mongo-1 container

```
docker exec -it apartment-service-backend_mongo-1_1 mongo
```

### Initiate the replica set

In the mongo shell, initiate the replica set using the following command

```
rs.initiate()
```

### Add mongo-2 to the replica set as a secondary node

```
rs.add( { host: 'mongo-2:27017', priority: 0, votes: 0 } )
```

### Add mongo-3 as the arbiter node

```
rs.addArb('mongo-3:27017')
```
