import { gql } from 'graphql-request';

export const walletQuery = gql`
  query Wallet($id: String!) {
    wallet(id: $id) {
      creditBalances {
        nodes {
          amountActive
          amountRetired
          creditCollection {
            denom
            metadataUris {
              nodes {
                url
              }
            }
          }
        }
      }
    }
  }
`;