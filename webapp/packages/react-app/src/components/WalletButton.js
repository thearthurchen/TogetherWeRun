import React from "react";
import { Button } from "@material-ui/core";

function WalletButton({
  provider,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  signedInAddress,
}) {
  return (
    <Button
      color="primary"
      variant="contained"
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {!provider ? "Connect Wallet" : `${signedInAddress} Disconnect Wallet`}
    </Button>
  );
}

export default WalletButton;
