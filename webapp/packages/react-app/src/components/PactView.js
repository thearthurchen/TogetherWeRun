  import React, { useState, useEffect } from 'react';
  import { Button } from '../components';
  import Modal from './Modal.js';
  import ConditionsForm from './ConditionsForm.js';
  import ProgressView from './ProgressView.js';
  import { ethers } from 'ethers';
  import { getPactState, getConditions, setConditions, startPact } from '../contractFunctions.js';

  // If host and pact state pending render a setConditions button
  // If participant and pact pending render pending if pledge made otherwise render pledge button
  const PactView = ({ provider, pactAddress, signedInAddress }) => {
    const [show, setShow] = useState(false);
    const [pledgeAmount, setPledgeAmount] = useState(0);
    const [endDate, setEndDate] = useState('12/12/22');
    const [daysPerCheck, setDaysPerCheck] = useState(0);
    const [totalMiles, setTotalMiles] = useState(0);
    const [pactState, setPactState] = useState(4);
    const [isHost, setIsHost] = useState(false);
    //state 0: pending, 1:started, 2: finished

    useEffect(()=>{
      //check if pending
      setIsHost(false);
      setPactState(4);
      async function setup(provider, pactAddress) {
        try {
          const [hostAddress, state] = await getPactState(provider, pactAddress);
          setPactState(state);
          if(ethers.utils.getAddress(hostAddress) === ethers.utils.getAddress(signedInAddress)){
            setIsHost(true);
          }
          // const conditions = await getConditions(provider, pactAddress);
          // const [curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck] = conditions;
          // console.log("conditions:", curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck);
        } catch(e) {
          console.log(e);
        }
      };
      setup(provider, pactAddress);

    }, [pactAddress])

    const submitChangeConditions = async () => {
      try {
        await setConditions(provider, pactAddress, pledgeAmount, totalMiles, Date.parse(endDate), daysPerCheck)
      } catch(e) {
        console.log(e);
      }
    }

    const handleStartPact = async (provider, pactAddress) => {
      await startPact(provider, pactAddress);
      const [hostAddress, state] = await getPactState(provider, pactAddress);
      setPactState(state);
      if(ethers.utils.getAddress(hostAddress) === ethers.utils.getAddress(signedInAddress)){
        setIsHost(true);
      }
    }

    return(
      <>
        {pactState === 0
        ?(
          <>
            Pact Pending
            <Modal
              title="Creating Pact"
              onClose={()=>
              setShow(false)}
              show={show}
              onSubmit={submitChangeConditions}
            >
              <ConditionsForm
                pledgeAmount={pledgeAmount} setPledgeAmount={setPledgeAmount}
                totalMiles={totalMiles} setTotalMiles={setTotalMiles}
                endDate={endDate} setEndDate={setEndDate}
                daysPerCheck={daysPerCheck} setDaysPerCheck={setDaysPerCheck}
              />
            </Modal>
            {isHost
            ?(
              <>
                <Button style={{ marginTop: "8px" }} onClick={() => setShow(true)}>
                    Change Conditions
                </Button>
                <Button style={{ marginTop: "8px" }} onClick={()=> handleStartPact(provider, pactAddress)}>
                    Start Running!
                </Button>
              </>
            )
            : <div>Participant the pact is pending </div>
            }
          </>
        )
        : null
        }
        {pactState === 1
         ?<ProgressView />
         : null
        }
      </>
    )
  }

  export default PactView;