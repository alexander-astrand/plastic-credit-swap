<template>
  <div>
    <WalletConnection />
    <TokenSwapper />
  </div>
</template>

<script>
// Import your components
import WalletConnection from "~/components/walletConnection.vue";
import TokenSwapper from "~/components/tokenSwapper.vue";

export default {
  name: "TokenSwapperPage",
  components: {
    // Register your components for use in the template
    WalletConnection,
    TokenSwapper,
  },
};
</script>
