import React, { useState, useEffect } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { Section, Header } from "./components";
import PactView from "./components/PactView.js";
import GatewayView from "./components/GatewayView.js";
import WalletButton from "./components/WalletButton.js";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";
import { getMyPact } from "./contractFunctions.js";

function App() {
  const [
    provider,
    loadWeb3Modal,
    logoutOfWeb3Modal,
    signedInAddress,
    roles,
  ] = useWeb3Modal();
  const [pactAddress, setPactAddress] = useState(null);

  useEffect(() => {
    async function setup(provider) {
      try {
        // console.log('useeffect', provider);
        const pactAddress = await getMyPact(provider);
        console.log(pactAddress);
        setPactAddress(pactAddress);
        console.log("pact", pactAddress);
        console.log("signed", signedInAddress);
        localStorage.setItem("signedInAddress", signedInAddress);
      } catch (e) {
        // Do nothing because they haven't created/joined pact
        // console.log("use effect error")
      }
    }
    setup(provider);
  }, [signedInAddress, provider]);

  return (
    <BrowserRouter>
      <Section>
        <Header>
          <WalletButton
            provider={provider}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            signedInAddress={signedInAddress}
          />
        </Header>
        <>
          {pactAddress ? (
            <PactView
              provider={provider}
              pactAddress={pactAddress}
              signedInAddress={signedInAddress}
            />
          ) : (
            <GatewayView
              provider={provider}
              setPactAddress={setPactAddress}
              signedInAddress={signedInAddress}
              logo={logo}
            />
          )}
        </>
      </Section>
    </BrowserRouter>
  );
}

export default App;
