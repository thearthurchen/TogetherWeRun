import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@material-ui/core";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Modal from "./Modal.js";
import ConditionsForm from "./ConditionsForm.js";
import ProgressView from "./ProgressView.js";
import { ethers } from "ethers";
import {
  getPactState,
  getConditions,
  setConditions,
  startPact,
  makePledge,
  getProgress,
  balanceOfLink,
  fundLink,
  updateProgress,
} from "../contractFunctions.js";
import PledgeView from "./PledgeView";

const PACT_STATE = {
  0: "PENDING",
  1: "STARTED",
  2: "FINISHED",
};

const redirectUri = "http://localhost:3000";
const stravaAuthUrl = "https://www.strava.com/oauth/authorize";
const STRAVA_URL = `${stravaAuthUrl}?client_id=63889&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read,activity:read`;
const STRAVA_EA_NEW_USER_URL = "http://localhost:8080/create-new-user";
let hasMadePostCall = false;

// If host and pact state pending render a setConditions button
// If participant and pact pending render pending if pledge made otherwise render pledge button
const PactView = ({ provider, pactAddress, signedInAddress }) => {
  const [show, setShow] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState();
  const [pledges, setPledges] = useState([]);
  const [endDate, setEndDate] = useState();
  const [daysPerCheck, setDaysPerCheck] = useState();
  const [totalMiles, setTotalMiles] = useState();
  const [pactState, setPactState] = useState();
  const [isHost, setIsHost] = useState(false);
  const [progress, setProgress] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [currentLink, setCurrentLink] = useState(0.0);
  // state 0: pending, 1:started, 2: finished
  const { search } = useLocation();

  const handleOAuth = useCallback(
    async (code) => {
      if (!code) {
        console.log("no access code");
        return 400;
      }

      try {
        const response = await axios({
          url: STRAVA_EA_NEW_USER_URL,
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            accessCode: code,
            userAddress: signedInAddress,
          },
        });

        console.log(response);
        return response.status;
      } catch (err) {
        console.log("bad axios requeset", err);
        return 400;
      }
    },
    [signedInAddress]
  );

  const getCode = useCallback(
    async (code) => {
      const OAuthStatus = await handleOAuth(code);
      console.log("oAuthMsg", OAuthStatus);
      return OAuthStatus;
    },
    [handleOAuth]
  );

  useEffect(() => {
    console.log(pactAddress);
    // check if pending
    async function setup(provider, pactAddress) {
      try {
        const code = new URLSearchParams(search).get("code");
        let status;
        if (!hasMadePostCall && Boolean(code)) {
          hasMadePostCall = true;
          alert("Please wait, attempting Strava authorization.");
          window.history.replaceState({}, document.title, "/");
          status = await getCode(code);

          if (status === 200) {
            alert("You are now signed up with Strava.");
          } else {
            alert(
              "Error signing up with Strava. Please try authorizing again and make sure to allow Strava to view your activity."
            );
          }
        }

        const { hostAddress, pactState } = await getPactState(
          provider,
          pactAddress
        );

        setPactState(pactState);
        if (
          ethers.utils.getAddress(hostAddress) ===
          ethers.utils.getAddress(signedInAddress)
        ) {
          setIsHost(true);
        }

        // Check current conditions
        const conditions = await getConditions(provider, pactAddress);
        const currentDate = new Date(conditions.endDateUtc.toNumber());
        setPledgeAmount(ethers.utils.formatEther(conditions.minPledge));
        setEndDate(currentDate.toLocaleDateString());
        setTotalMiles(conditions.totalMiles);
        setTotalMiles(conditions.totalMiles.toNumber());
        setDaysPerCheck(conditions.daysPerCheck.toNumber());
        const res = await getProgress(provider, pactAddress);
        console.log(res);
        setProgress(res.progress);
        setPledges(res.pledges);

        // (minPledge, totalMiles, endDateUtc, daysPerCheck)
        // const [curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck] = conditions;
        // console.log("conditions:", curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck);

        // Check if pledge made using queryFilter? Then grey out pledge button?
      } catch (e) {
        console.log(e);
      } finally {
        setInitialized(true);
      }
    }
    if (!initialized) {
      setup(provider, pactAddress);
    }
    // balanceOfLink(provider, pactAddress).then((amount) => {
    //   console.log(amount);
    //   setCurrentLink(amount);
    // });
  }, [
    pactAddress,
    provider,
    signedInAddress,
    getCode,
    handleOAuth,
    search,
    initialized,
  ]);

  const submitChangeConditions = async () => {
    try {
      await setConditions(
        provider,
        pactAddress,
        ethers.utils.parseEther(pledgeAmount),
        totalMiles,
        Date.parse(endDate),
        daysPerCheck
      );
    } catch (e) {
      console.log(e);
    }
  };

  const handleStartPact = async (provider, pactAddress) => {
    await startPact(provider, pactAddress);
    const { hostAddress, pactState } = await getPactState(
      provider,
      pactAddress
    );
    setPactState(pactState);
    if (
      ethers.utils.getAddress(hostAddress) ===
      ethers.utils.getAddress(signedInAddress)
    ) {
      setIsHost(true);
    }
  };

  const handleMakePledge = async (provider, pactAddress) => {
    await makePledge(pledgeAmount, provider, pactAddress);
    setTimeout(async () => {
      const res = await getProgress(provider, pactAddress);
      console.log(res);
      setProgress(res.progress);
      setPledges(res.pledges);
    }, 1000);
  };

  const handleUpdateProgress = async (provider, pactAddress) => {
    await updateProgress(provider, pactAddress);
  };

  const handleFundLink = async (provider, pactAddress) => {
    await fundLink(provider, pactAddress);
  };

  return (
    <>
      <>
        <h1>Pact is {PACT_STATE[pactState]}</h1>
        <br />
        {isHost && <>Chainlink in the bank - {currentLink}</>}
      </>
      {pactState === 0 ? (
        <>
          <Modal
            title="Creating Pact"
            onClose={() => setShow(false)}
            show={show}
            onSubmit={submitChangeConditions}
          >
            <ConditionsForm
              pledgeAmount={pledgeAmount}
              setPledgeAmount={setPledgeAmount}
              totalMiles={totalMiles}
              setTotalMiles={setTotalMiles}
              endDate={endDate}
              setEndDate={setEndDate}
              daysPerCheck={daysPerCheck}
              setDaysPerCheck={setDaysPerCheck}
            />
          </Modal>
          <PledgeView pledges={pledges} />
          {isHost ? (
            <>
              <Button
                color="primary"
                variant="contained"
                style={{ marginTop: "8px" }}
                onClick={() => setShow(true)}
              >
                Change Conditions
              </Button>
              <Button
                color="primary"
                variant="contained"
                style={{ marginTop: "8px" }}
                onClick={() => handleFundLink(provider, pactAddress)}
              >
                Fund Link
              </Button>
              <Button
                color="primary"
                variant="contained"
                style={{ marginTop: "8px" }}
                onClick={() => handleMakePledge(provider, pactAddress)}
              >
                Make Pledge
              </Button>
              <Button
                color="primary"
                variant="contained"
                style={{ marginTop: "8px" }}
                onClick={() => handleStartPact(provider, pactAddress)}
              >
                Start Running!
              </Button>
            </>
          ) : (
            <>
              <div>Participant the pact is pending</div>
              <Button
                color="primary"
                variant="contained"
                style={{ marginTop: "8px" }}
                onClick={() => handleMakePledge(provider, pactAddress)}
              >
                Make Pledge
              </Button>
            </>
          )}
        </>
      ) : null}
      {pactState === 1 ? (
        <>
          <ProgressView progress={progress} />
          <Button
            color="primary"
            variant="contained"
            style={{ marginTop: "8px" }}
            onClick={() => handleUpdateProgress(provider, pactAddress)}
          >
            Update Progress
          </Button>
        </>
      ) : null}
      <>
        <Button
          color="primary"
          variant="contained"
          style={{ marginTop: "8px" }}
        >
          <a
            style={{ color: "white", textDecoration: "none" }}
            href={STRAVA_URL}
            target="_self"
          >
            Link Strava
          </a>
        </Button>
      </>
    </>
  );
};

export default PactView;
