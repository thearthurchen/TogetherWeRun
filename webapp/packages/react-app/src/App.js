import React, {useState} from "react";
import { getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";
import { ethers } from "ethers";
import { Body, Button, Header, Image, Link } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";
import GET_TRANSFERS from "./graphql/subgraph";
import { myPact, createPact, joinPact, setConditions } from "./contractFunctions.js";

function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress }) {
  return (
    <Button
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {!provider ? 'Connect Wallet' : `${signedInAddress} Disconnect Wallet`}
    </Button>
  );
}

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles] = useWeb3Modal();

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
      console.log('provider:', provider)
      console.log('signedInAddress:', signedInAddress)
      console.log('roles:', roles)
    }
    // async function setup () {
    //   const _provider = await ethers.provider;
    //   console.log(_provider);
    //   setProvider(_provider);
    //   console.log(await ethers.getSigners());
    // }
    // setup();
  }, [loading, error, data]);

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} signedInAddress={signedInAddress}/>
      </Header>
      <Body>
        <Image src={logo} alt="react-logo" />
        <Button style={{ marginTop: "8px" }} onClick={() => myPact(provider)}>
          My Pact
        </Button>
        <Button style={{ marginTop: "8px" }} onClick={() => createPact(provider, 'hello')}>
          Create Pact
        </Button>
        <Button style={{ marginTop: "8px" }} onClick={() => setConditions(provider,'0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968', 20, Date.parse("12/12/2050"), 50)}>
          Set Conditions
        </Button>
        <Button style={{ marginTop: "8px" }} onClick={() => joinPact(provider, '0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968', signedInAddress, 'hello')}>
          Join Pact
        </Button>
      </Body>
    </div>
  );
}

export default App;
