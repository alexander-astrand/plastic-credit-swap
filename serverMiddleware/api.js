const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const JSONbig = require('json-bigint'); // For handling BigInt serialization
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

function extractIpfsHashFromResponse(plasticCreditResponse) {
    if (plasticCreditResponse.creditCollection.metadataUris && plasticCreditResponse.creditCollection.metadataUris.length > 0) {
        console.log('Found IPFS hash:', plasticCreditResponse.creditCollection.metadataUris[0]);
        const ipfsUri = plasticCreditResponse.creditCollection.metadataUris[0];
        return ipfsUri.replace('ipfs://', '');
    }
    return null; // Return null if no IPFS hash is found
}

app.post('/fetch-plastic-credit', async (req, res) => {
    const { empowerchain } = require('@empower-plastic/empowerjs');
    const { denom, amountToWrap } = req.body;
    console.log('Fetching plastic credit data for denom:', denom, 'and amountToWrap:', amountToWrap);

    if (!denom || amountToWrap === undefined) {
        return res.status(400).send('Both denom and amountToWrap are required');
    }

    try {
        const rpcQueryClient = await empowerchain.ClientFactory.createRPCQueryClient({
            rpcEndpoint: "https://testnet.empowerchain.io:26659",
        });

        const plasticCreditResponse = await rpcQueryClient.empowerchain.plasticcredit.creditCollection({ denom });
        const ipfsHash = extractIpfsHashFromResponse(plasticCreditResponse);
        console.log('IPFS hash:', ipfsHash);
        let metadata = {};

        if (ipfsHash) {
            try {
                const ipfsResponse = await axios.get(`https://ipfs.empowerchain.io/ipfs/${ipfsHash}`);
                metadata = ipfsResponse.data;
            } catch (ipfsError) {
                console.error('Error fetching data from IPFS:', ipfsError);
                // Optionally handle IPFS errors separately
            }
        }

        const NFTPayload = {
            denom: denom,
            amount: amountToWrap,
            metadata: metadata
        };
        console.log('Response payload:', NFTPayload);
        res.send(JSONbig.stringify(NFTPayload));
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching plastic credit data');
    }
});

module.exports = app;

