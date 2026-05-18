const { S3Client } = require("@aws-sdk/client-s3");

const storj = new S3Client({
    region: "global",

    endpoint: process.env.STORJ_ENDPOINT,

    credentials: {
        accessKeyId: process.env.STORJ_ACCESS_KEY,
        secretAccessKey: process.env.STORJ_SECRET_KEY
    }
});

module.exports = storj;