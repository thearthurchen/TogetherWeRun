import React, { useState } from "react";
import Modal from "./Modal.js";
import { Button } from ".";
import { ethers } from "ethers";
import { createPact, fundLink, joinPact } from "../contractFunctions.js";

const GatewayView = ({ provider, setPactAddress, signedInAddress, logo }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const submitCreatePact = async (provider) => {
    try {
      const pactAddress = await createPact(provider, inviteCode);
      setPactAddress(pactAddress);
    } catch (e) {
      console.log(e);
    }
  };

  // TODO fix this?
  const handleJoinPact = async (provider, hostAddress, inviteCode) => {
    const pactAddress = await joinPact(
      provider,
      ethers.utils.getAddress("0xDBbdbcCeDeEb52Bea5cb0042008458378dB32672"),
      inviteCode
    );
    console.log(pactAddress);
    setPactAddress(pactAddress);
  };

  return (
    <>
      Gateway
      <Modal
        title=""
        onClose={() => setShowInviteModal(false)}
        show={showInviteModal}
        onSubmit={() => submitCreatePact(provider)}
      >
        <form>
          <label>
            Invite code:
            <input
              name="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            ></input>
          </label>
        </form>
      </Modal>
      <Button
        style={{ marginTop: "8px" }}
        onClick={() => {
          setShowInviteModal(true);
        }}
      >
        Create Pact
      </Button>
      <Button
        style={{ marginTop: "8px" }}
        onClick={() => handleJoinPact(provider, "", "abc")}
      >
        Join Pact
      </Button>
    </>
  );
};

export default GatewayView;
