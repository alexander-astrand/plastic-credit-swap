export function extractIpfsHashFromResponse(plasticCreditResponse) {
    if (
      plasticCreditResponse.creditCollection.metadataUris &&
      plasticCreditResponse.creditCollection.metadataUris.length > 0
    ) {
      const ipfsUri = plasticCreditResponse.creditCollection.metadataUris[0];
      return ipfsUri.replace("ipfs://", "");
    }
    return null; // Return null if no IPFS hash is found
  }