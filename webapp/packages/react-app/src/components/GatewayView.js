import React, { useState } from "react";
import Modal from "./Modal.js";
import ConditionsForm from "./ConditionsForm.js";
import { Button, Image } from '.'
import { ethers } from "ethers";
import { getMyPact, createPact, setConditions, joinPact } from '../contractFunctions.js';

function GatewayView({ provider, signedInAddress, setPactAddress, logo }) {
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
      setPactAddress(pactAddress);
    } catch(e) {
      console.log(e);
    }
  }

  return(
    <>
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

        <Button style={{ marginTop: "8px" }} onClick={() => joinPact(provider, ethers.utils.getAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'), 'hello')}>
          Join Pact
        </Button>
    </>
  )
}

export default GatewayView;