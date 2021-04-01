import React, {useState} from "react";
import { Contract } from "@ethersproject/contracts";
import { getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";
import { ethers } from "ethers";

import { Body, Button, Header, Image, Link } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

// test function to read chain data
async function readOnChainData(provider) {
  // Should replace with the end-user wallet, e.g. Metamask
  // const defaultProvider = provider;
  // Create an instance of an ethers.js Contract
  // Read more about ethers.js on https://docs.ethers.io/v5/api/contract/contract/

  // The provider is grabbed in useEffect of main app
  // const defaultProvider = getDefaultProvider('http://localhost:8454');

  // const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, defaultProvider);
  // const owner = await gateway.owner();
  // console.log(gateway);
  // window.alert(owner);
}

async function myPact(provider) {
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
  const signer = provider.getSigner();
  const resp = await gateway.connect(signer).getMyPact();
  console.log(resp);
}

// TODO: Create invite code function to pass in
async function createPact(provider, inviteCode) {
  const signer = provider.getSigner();
  console.log(provider);
  console.log(signer);
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
  console.log(gateway);
  gateway.on("PactCreated", (host, id, event)=> {
    console.log(`${host} created pact with pact id: ${id}`)
  })
  try {
    await gateway.connect(signer).createPact(inviteCode);
  } catch (e) {
    console.log(e);
  }
}

async function joinPact() {
  console.log('joined');
}

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
  // const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles] = useWeb3Modal();

  React.useEffect(() => {
    // if (!loading && !error && data && data.transfers) {
    //   console.log({ transfers: data.transfers });
    //   console.log('provider:', provider)
    //   console.log('signedInAddress:', signedInAddress)
    //   console.log('roles:', roles)
    // }
    // async function setup () {
    //   const _provider = await ethers.provider;
    //   console.log(_provider);
    //   setProvider(_provider);
    //   console.log(await ethers.getSigners());
    // }
    // setup();
    console.log(signedInAddress);
  }, [signedInAddress]);

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} signedInAddress={signedInAddress}/>
      </Header>
      <Body>
        <Image src={logo} alt="react-logo" />
        <Button onClick={() => readOnChainData(provider)}>
          Read On-Chain Balance
        </Button>
        <Button style={{ marginTop: "8px" }} onClick={() => myPact(provider)}>
          My Pact
        </Button>
        <Button style={{ marginTop: "8px" }} onClick={() => createPact(provider, 'hello')}>
          Create Pact
        </Button>
        <Button style={{ marginTop: "8px" }} onClick={() => joinPact()}>
          Join Pact
        </Button>
      </Body>
    </div>
  );
}

export default App;
