const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { DirectSecp256k1Wallet, SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const crypto = require('crypto');
const app = express();
const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK({ pinataJWTKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhMzIzMzhjNS1hNzBiLTRhZmMtYTNkYS0yODU1Y2U2NjQxNWQiLCJlbWFpbCI6InBpbmF0YUBhc3RyYW5kLnh5eiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI0NzUwMGU3NDUxMjg5YThmYmE3ZiIsInNjb3BlZEtleVNlY3JldCI6Ijk3MTQ3NGMzMGQ4ZjI4YWQwNDg0ODc4NzMwYWI3NDUxNWEzNmNkZDkyYWVmY2VlMTk1ODk4ZWQwMDljNjUzMjkiLCJpYXQiOjE3MDM3MjI5MTV9.xFfwT3wysY99clpdMNi1epfosLGip5XpP3Nlm8XzQro'});

// Middleware to parse JSON bodies
app.use(bodyParser.json());


const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1'
});

const privateKeyPem = privateKey.export({ type: 'sec1', format: 'pem' });

function extractIpfsHashFromResponse(plasticCreditResponse) {
    if (plasticCreditResponse.creditCollection.metadataUris && plasticCreditResponse.creditCollection.metadataUris.length > 0) {
        const ipfsUri = plasticCreditResponse.creditCollection.metadataUris[0];
        return ipfsUri.replace('ipfs://', '');
    }
    return null; // Return null if no IPFS hash is found
}

// function signData(data, privateKeyPem) {
//     const sign = crypto.createSign('SHA256');
//     sign.update(data);
//     sign.end();
//     return sign.sign(privateKeyPem, 'base64'); // Returning signature in base64
// }

async function mintNFT(contractAddress, mintMsg, privateKeyPem, rpcEndpoint) {
    const wallet = await DirectSecp256k1Wallet.fromPem(privateKeyPem);
    const [firstAccount] = await wallet.getAccounts();
    const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, wallet);

    return await client.execute(firstAccount.address, contractAddress, mintMsg, "auto");
}


async function uploadToIpfs(metadata) {
    const ipfs = ipfsClient.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
    const { path } = await ipfs.add(JSON.stringify(metadata));
    return `ipfs://${path}`;
}

app.post('/fetch-and-mint-plastic-credit', async (req, res) => {
    const { denom, amountToWrap, address } = req.body;

    if (!denom || amountToWrap === undefined || !address) {
        return res.status(400).send('Denom, amountToWrap, and address are required');
    }

    try {
        const { empowerchain } = require('@empower-plastic/empowerjs');
        const rpcQueryClient = await empowerchain.ClientFactory.createRPCQueryClient({
            rpcEndpoint: "https://testnet.empowerchain.io:26659",
        });

        const plasticCreditResponse = await rpcQueryClient.empowerchain.plasticcredit.creditCollection({ denom });
        const ipfsHash = extractIpfsHashFromResponse(plasticCreditResponse);
        let ipfsData = {};

        if (ipfsHash) {
            const ipfsHash2 = `https://ipfs.empowerchain.io/ipfs/${ipfsHash}`;
            const ipfsResponse = await axios.get(`https://ipfs.empowerchain.io/ipfs/${ipfsHash}`);
            ipfsData = ipfsResponse.data;
            console.log('IPFS metadata:', ipfsData);
            console.log(ipfsData.credit_props[1].content[0].url);

            const metadata = {
                name: "Wrapped Plastic Credits",
                description: `${amountToWrap} wrapped plastic credits from collection ${denom}`,
                image: ipfsData.credit_props[1].content[0].url,
                attributes: [
                  { trait_type: "Collection Metadata", value: ipfsHash2 },
                  { trait_type: "Wrapped Plastic Credits", value: amountToWrap },
                ],
              };
              const pinataResponse = await pinata.pinJSONToIPFS(metadata);
              console.log("Pinata link: ", pinataResponse);
              const ipfsLink = `https://ipfs.io/ipfs/${pinataResponse.IpfsHash}`;
              
            // const payloadString = JSON.stringify(metadata);
            // const signature = signData(payloadString, privateKeyPem);

            const mintMsg = {
                mint: {
                    owner: address,
                    token_uri: ipfsLink,
                    // signature: signature
                }
            };
            res.send({ mintMsg, metadata, ipfsData });
            // console.log('Minting NFT with message:', mintMsg);
            // try {
            //     console.log(privateKeyPem);
            //     const mintResult = await mintNFT("YOUR_CONTRACT_ADDRESS", mintMsg, privateKeyPem, "https://testnet.empowerchain.io:26659");
            //     res.json({ mintTransactionResult: mintResult });
            // } catch (mintError) {
            //     console.error('Error minting NFT:', mintError);
            //     res.status(500).send('Error minting NFT');
            // }
        } else {
            res.status(404).send('IPFS hash not found');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = app;
