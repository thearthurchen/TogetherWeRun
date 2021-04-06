import React, { useState, useEffect } from "react";
import { getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";
import { ethers } from "ethers";
import { Body, Header } from "./components";
import PactView from "./components/PactView.js";
import GatewayView from "./components/GatewayView.js";
import WalletButton from "./components/WalletButton.js";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";
import GET_TRANSFERS from "./graphql/subgraph";
import { getMyPact, createPact } from "./contractFunctions.js";

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles] = useWeb3Modal();
  const [pactAddress, setPactAddress] = useState(null);

  useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      // console.log({ transfers: data.transfers });
      // console.log('provider:', provider)
      // console.log('signedInAddress:', signedInAddress)
      // console.log('roles:', roles)
    }

  }, [loading, error, data]);

  useEffect(()=>{
    async function setup(provider) {
      try {
        // console.log('useeffect', provider);
        const pactAddress = await getMyPact(provider);
        setPactAddress(pactAddress);
      } catch (e) {
        // Do nothing because they haven't created/joined pact
        // console.log("use effect error")
      }
    }
    setup(provider);
  },[signedInAddress])

  const handleCreatePact = () =>{
    createPact(provider, 'hello')
  }

  return (
    <>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} signedInAddress={signedInAddress}/>
      </Header>
      <Body>
        {pactAddress
          ? <PactView provider= {provider} pactAddress={pactAddress} signedInAddress={signedInAddress}/>
          : <GatewayView provider={provider} setPactAddress={setPactAddress} signedInAddress={signedInAddress} logo={logo}/>
        }
      </Body>
    </>
  );
}

export default App;
