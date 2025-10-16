import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const opts = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global{
    // allow global var in dev to prevent multiple instances
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if(!global._mongoClientPromise){
    client = new MongoClient(uri, opts);
    global._mongoClientPromise = client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
}

clientPromise = global._mongoClientPromise;

export default clientPromise;