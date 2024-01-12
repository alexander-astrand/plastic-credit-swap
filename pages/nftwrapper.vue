<template>
  <div>
    <WalletConnection />
    <NftWrap />
  </div>
</template>

<script>
// Import your components
import WalletConnection from "~/components/walletConnection.vue";
import NftWrap from "~/components/nftWrap.vue";

export default {
  name: "NftWrapPage",
  components: {
    // Register your components for use in the template
    WalletConnection,
    NftWrap,
  },
};
</script>
