import React, { useState } from "react";
import Modal from "./Modal.js";
import ConditionsForm from "./ConditionsForm.js";
import { Button, Image } from '.'
import { ethers } from "ethers";
import { getMyPact, createPact, setConditions, joinPact } from '../contractFunctions.js';

const GatewayView = ({ provider, setPactAddress, signedInAddress, logo }) => {
  const [show, setShow] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState(1000000);
  const [endDate, setEndDate] = useState('10/10/22');
  const [daysPerCheck, setDaysPerCheck] = useState(1);
  const [totalMiles, setTotalMiles] = useState(40);

  const submitCreatePact = async (provider, pledgeAmount, totalMiles, endDate, daysPerCheck) => {
    // console.log(pledgeAmount, endDate, daysPerCheck);
    //TODO: create and set unique invite code
    try {
      const pactAddress = await createPact(provider, 'hello');
      console.log(pactAddress, signedInAddress)
      await setConditions(provider, pactAddress, pledgeAmount, totalMiles, Date.parse(endDate), daysPerCheck)
      setPactAddress(pactAddress);
    } catch(e) {
      console.log(e);
    }
  }

  const handleJoinPact = async (provider, hostAddress, inviteCode) => {
    const pactAddress = await joinPact(provider, ethers.utils.getAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'), 'hello');
    console.log(pactAddress);
    setPactAddress(pactAddress);
  }

  return(
    <>
      Gateway
      <Modal title="Creating Pact" onClose={()=> setShow(false)} show={show} onSubmit={()=> submitCreatePact(provider, pledgeAmount, totalMiles, endDate, daysPerCheck)}>
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
        <Button style={{ marginTop: "8px" }} onClick={() => handleJoinPact(provider, '', 'inviteCode')}>
          Join Pact
        </Button>
    </>
  )
}

export default GatewayView;