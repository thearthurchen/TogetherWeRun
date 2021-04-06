import React, { useState, useEffect } from "react";
import { getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";
import { ethers } from "ethers";
import { Body, Button, Header, Image, Link } from "./components";
import Modal from "./components/Modal.js";
import ConditionsForm from "./components/ConditionsForm.js";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";
import GET_TRANSFERS from "./graphql/subgraph";
import { getMyPact, createPact, joinPact, setConditions, getConditions, startPact, getPactState } from "./contractFunctions.js";

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

  // If host and pact state pending render a setConditions button
  // If participant and pact pending render pending if pledge made otherwise render pledge button
function PactView({ provider, pactAddress }) {
  const [show, setShow] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState(0);
  const [endDate, setEndDate] = useState(Date.now());
  const [daysPerCheck, setDaysPerCheck] = useState(0);
  const [totalMiles, setTotalMiles] = useState(0);
  const [pactState, setPactState] = useState(0);
  //state 0: pending, 1:started, 2: finished

  useEffect(()=>{
    //check if pending
    getState();
    grabCurrentConditions();

  },[pactState])

  const grabCurrentConditions = async ()=> {
    const conditions = await getConditions(provider, pactAddress);
    const [curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck] = conditions;
    console.log("conditions:", curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck);
  }

  const getState = async () => {
    const state = await getPactState(provider, pactAddress);
    setPactState(state);
  };

  const handleStartPact = async () => {
    await startPact(provider, pactAddress, setPactState);
    await getState();
  }

  const submitChangeConditions = async () => {
    try {

    } catch(e) {

    }
  }

  return(
    <div>
      Pact View
      <Modal title="Creating Pact" onClose={()=> setShow(false)} show={show} onSubmit={submitChangeConditions}>
        <ConditionsForm
          pledgeAmount={pledgeAmount} setPledgeAmount={setPledgeAmount}
          totalMiles={totalMiles} setTotalMiles={setTotalMiles}
          endDate={endDate} setEndDate={setEndDate}
          daysPerCheck={daysPerCheck} setDaysPerCheck={setDaysPerCheck}
        />
      </Modal>
      <Button style={{ marginTop: "8px" }} onClick={() => setShow(true)}>
          Change Conditions
      </Button>
      <Button style={{ marginTop: "8px" }} onClick={handleStartPact}>
          Start Running!
      </Button>
    </div>
  )
}

function GatewayView({ provider, signedInAddress, setPactAddress }) {
  const [show, setShow] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState(0);
  const [endDate, setEndDate] = useState(Date.now());
  const [daysPerCheck, setDaysPerCheck] = useState(0);
  const [totalMiles, setTotalMiles] = useState(0);

  const submitCreatePact = async () => {
    // console.log(pledgeAmount, endDate, daysPerCheck);
    //TODO: create and set unique invite code
    try {
      const pactAddress = await createPact(provider, 'hello');
      await setConditions(provider, pactAddress, pledgeAmount, totalMiles, endDate, daysPerCheck)
      console.log(pactAddress);
      setPactAddress(pactAddress);
    } catch(e) {
      console.log(e);
    }
  }

  return(
    <div>
      Gateway
      <Modal title="Creating Pact" onClose={()=> setShow(false)} show={show} onSubmit={submitCreatePact}>
        <ConditionsForm
          pledgeAmount={pledgeAmount} setPledgeAmount={setPledgeAmount}
          totalMiles={totalMiles} setTotalMiles={setTotalMiles}
          endDate={endDate} setEndDate={setEndDate}
          daysPerCheck={daysPerCheck} setDaysPerCheck={setDaysPerCheck}
        />
      </Modal>
        <Image src={logo} alt="react-logo" />
        <Button style={{ marginTop: "8px" }} onClick={() => getMyPact(provider)}>
          My Pact
        </Button>
        <Button style={{ marginTop: "8px" }} onClick={() => setShow(true)}>
          Create Pact
        </Button>

        <Button style={{ marginTop: "8px" }} onClick={() => joinPact(provider, '0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968', signedInAddress, 'hello')}>
          Join Pact
        </Button>
    </div>
  )
}

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

  }, [loading, error, data, signedInAddress]);

  useEffect(()=>{
    async function renderView(provider) {
      try {
        // console.log('useeffect', provider);
        const pactAddress = await getMyPact(provider);
        setPactAddress(pactAddress);
      } catch (e) {
        // Do nothing because they haven't created/joined pact
        // console.log("use effect error")
      }
    }
    renderView(provider);
  },[signedInAddress])

  const handleCreatePact = () =>{
    createPact(provider, 'hello')
  }

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} signedInAddress={signedInAddress}/>
      </Header>
      <Body>
        {signedInAddress}
        {pactAddress
          ? <PactView provider= {provider} pactAddress={pactAddress}/>
          : <GatewayView provider={provider} setPactAddress={setPactAddress} signedInAddress={signedInAddress} />
        }
      </Body>
    </div>
  );
}

export default App;
