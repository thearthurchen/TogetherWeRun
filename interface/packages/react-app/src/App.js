import React from "react";
import { Contract } from "@ethersproject/contracts";
import { getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import { Body, Button, Header, Image, Link } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

// test function to read chain data
async function readOnChainData(provider) {
  // Should replace with the end-user wallet, e.g. Metamask
  const defaultProvider = provider;
  // Create an instance of an ethers.js Contract
  // Read more about ethers.js on https://docs.ethers.io/v5/api/contract/contract/

  // The provider is grabbed in useEffect of main app
  // const defaultProvider = getDefaultProvider('http://localhost:8454');

  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, defaultProvider);
  const owner = await gateway.owner();
  console.log(gateway);
  window.alert(owner);
}

async function myPact(provider, ) {

}

// TODO: Create invite code function to pass in
async function createPact(provider, inviteCode) {
  const defaultProvider = provider;
  const signer = defaultProvider.getSigner();
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, defaultProvider);

  await gateway.connect(signer).createPact(inviteCode);
  gateway.on("PactCreated", (host, id, event)=> {
    console.log(`${host} created pact with pact id: ${id}`)
  })
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
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles] = useWeb3Modal();

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
      console.log('provider:', provider)
      console.log('signedInAddress:', signedInAddress)
      console.log('roles:', roles)
    }
  }, [loading, error, data]);

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
        <Button style={{ marginTop: "8px" }} onClick={() => myPact()}>
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
