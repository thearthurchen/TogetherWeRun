import React, { useState } from "react";
import { Button, TextField } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import Modal from "./Modal.js";
import { ethers } from "ethers";
import { createPact, fundLink, joinPact } from "../contractFunctions.js";

const GatewayView = ({ provider, setPactAddress, signedInAddress, logo }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [hostAddress, setHostAddress] = useState("");

  const submitCreatePact = async (provider) => {
    try {
      const pactAddress = await createPact(provider, inviteCode);
      setPactAddress(pactAddress);
      setShowInviteModal(false);
    } catch (e) {
      console.log(e);
    }
  };

  const submitJoinPact = async (provider, hostAddress, inviteCode) => {
    const pactAddress = await joinPact(
      provider,
      ethers.utils.getAddress(hostAddress),
      inviteCode
    );
    console.log(pactAddress);
    setPactAddress(pactAddress);
    setShowJoinModal(false);
  };

  const styles = {
    root: {
      background: "black"
    },
    input: {
      color: "#2EFF22"
    }
  };

  return (
    <>
      <h1>Together We Run</h1>
      <Modal
        title="Create Pact"
        onClose={() => setShowInviteModal(false)}
        show={showInviteModal}
        onSubmit={() => submitCreatePact(provider)}
      >
        <form>
          <TextField
            label="Please enter invite code"
            name="inviteCode"
            type="text"
            variant="filled"
            InputLabelProps={{
              style: { color: '#afafb3' }
            }}
            inputProps={{
              style: { color: 'white' }
            }}
            fullWidth={true}
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
          />
        </form>
      </Modal>
      <Modal
        title="Join Pact"
        onClose={() => setShowJoinModal(false)}
        show={showJoinModal}
        onSubmit={() => submitJoinPact(provider)}
      >
        <form>
          <TextField
            label="Please enter host address"
            name="hostAddress"
            type="text"
            value={hostAddress}
            variant="filled"
            InputLabelProps={{
              style: { color: '#afafb3' }
            }}
            inputProps={{
              style: { color: 'white'}
            }}
            fullWidth={true}
            onChange={(e) => setHostAddress(e.target.value)}
          />
          <br/>
          <TextField
            label="Please enter invite code"
            name="inviteCode"
            type="text"
            value={inviteCode}
            variant="filled"
            InputLabelProps={{
              style: { color: '#afafb3' }
            }}
            inputProps={{
              style: { color: 'white'}
            }}
            fullWidth={true}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </form>
      </Modal>
      <Button
        color="primary"
        variant="contained"
        style={{ marginTop: "8px" }}
        onClick={() => {
          setShowInviteModal(true);
        }}
      >
        Create Pact
      </Button>
      <Button
        color="primary"
        variant="contained"
        style={{ marginTop: "8px" }}
        onClick={() => {
          setShowJoinModal(true);
        }}
      >
        Join Pact
      </Button>
    </>
  );
};

export default GatewayView;
