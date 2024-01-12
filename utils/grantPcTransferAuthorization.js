import Swal from "sweetalert2";
import {
    cosmos,
    empowerchain,
    getSigningTM37EmpowerchainClient,
  } from "@empower-plastic/empowerjs";

export async function grantAuthorization(walletAddress, offlineSigner, denom, selectedAmount) {
    console.log(process.env.NUXT_ENV_RPC_ENDPOINT);
    try {
      if (
        walletAddress ===
        "empower1y2cc50x64vslpqsmz8x2tcj8h3w0l6mpx87739"
      ) {
        alert("You are already authorized");
        return; // Return early to avoid further processing
      }

      const client = await getSigningTM37EmpowerchainClient({
        rpcEndpoint: process.env.NUXT_ENV_RPC_ENDPOINT,
        signer: offlineSigner,
      });

      const w = empowerchain.plasticcredit.TransferAuthorization.fromPartial({
        denom: denom,
        maxCredits: selectedAmount,
      });

      const authz = cosmos.authz.v1beta1.MessageComposer.withTypeUrl.grant({
        granter: walletAddress,
        grantee: process.env.NUXT_ENV_CONTRACT_ADDRESS,
        grant: {
          authorization: {
            typeUrl: "/empowerchain.plasticcredit.TransferAuthorization",
            value:
              empowerchain.plasticcredit.TransferAuthorization.encode(
                w
              ).finish(),
          },
        },
      });

      const response = await client.signAndBroadcast(
        walletAddress,
        [authz],
        {
          amount: [{ amount: "100000", denom: "umpwr" }],
          gas: "200000",
        }
      );

      // Handle response here (e.g., check if the transaction was successful)
      console.log("Transaction response:", response);
      if (response.code === 0) {
        return true; // Indicate success
      } else {
        return false; // Indicate failure
      }
    } catch (error) {
      // Handle or log the error
      console.error(
        "An error occurred during the authorization process:",
        error
      );
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to grant authorization!",
        footer: '<a href="#">Why do I have this issue?</a>',
      });
    }
  }