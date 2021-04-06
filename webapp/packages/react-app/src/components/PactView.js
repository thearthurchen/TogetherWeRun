  import React, { useState, useEffect } from 'react';
  import { Button } from '../components';
  import Modal from './Modal.js';
  import ConditionsForm from './ConditionsForm.js';
  import { getPactState, getConditions, startPact } from '../contractFunctions.js';

  // If host and pact state pending render a setConditions button
  // If participant and pact pending render pending if pledge made otherwise render pledge button
  function PactView({ provider, pactAddress, signedInAddress }) {
    const [show, setShow] = useState(false);
    const [pledgeAmount, setPledgeAmount] = useState(0);
    const [endDate, setEndDate] = useState(Date.now());
    const [daysPerCheck, setDaysPerCheck] = useState(0);
    const [totalMiles, setTotalMiles] = useState(0);
    const [pactState, setPactState] = useState(4);
    const [isHost, setIsHost] = useState(true);
    //state 0: pending, 1:started, 2: finished

    useEffect(()=>{
      //check if pending
      console.log('run')
      async function setup(provider, pactAddress) {
        const state = await getPactState(provider, pactAddress)
        setPactState(state);
        const conditions = await getConditions(provider, pactAddress);
        const [curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck] = conditions;
        console.log("conditions:", curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck);
      };
      setup(provider, pactAddress);

    },[signedInAddress])





    const handleStartPact = async () => {
      await startPact(provider, pactAddress, setPactState);
      // await getState();
    }

    const submitChangeConditions = async () => {
      try {

      } catch(e) {

      }
    }

    return(
      <>
        {pactState === 0 && isHost
        ?
        <>
          Pact Pending
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
        </>
        : null
        }
        {pactState === 1
         ?<div>
            Pact Started
          </div>
         : null
        }
      </>
    )
  }

  export default PactView;