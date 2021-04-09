import React, { useState, useEffect } from 'react'
import { Button, Header } from '../components'
import Modal from './Modal.js'
import ConditionsForm from './ConditionsForm.js'
import ProgressView from './ProgressView.js'
import { ethers } from 'ethers'
import { getPactState, getConditions, setConditions, startPact, makePledge, getProgress, getParticipants } from '../contractFunctions.js'
import PledgeView from './PledgeView'

const PACT_STATE = {
  0: 'PENDING',
  1: 'STARTED',
  2: 'FINISHED'
}

const STRAVA_URL = 'https://www.strava.com/oauth/authorize?client_id=63889&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=read,activity:read'

// If host and pact state pending render a setConditions button
// If participant and pact pending render pending if pledge made otherwise render pledge button
const PactView = ({ provider, pactAddress, signedInAddress }) => {
  const [show, setShow] = useState(false)
  const [pledgeAmount, setPledgeAmount] = useState()
  const [pledges, setPledges] = useState([])
  const [endDate, setEndDate] = useState()
  const [daysPerCheck, setDaysPerCheck] = useState()
  const [totalMiles, setTotalMiles] = useState()
  const [pactState, setPactState] = useState()
  const [isHost, setIsHost] = useState(false)
  const [progress, setProgress] = useState([])
  const [initialized, setInitialized] = useState(false)
  // state 0: pending, 1:started, 2: finished

  useEffect(() => {
    // check if pending
    async function setup (provider, pactAddress) {
      try {
        const { hostAddress, pactState } = await getPactState(provider, pactAddress)

        setPactState(pactState)
        if (ethers.utils.getAddress(hostAddress) === ethers.utils.getAddress(signedInAddress)) {
          setIsHost(true)
        }

        // Check current conditions
        const conditions = await getConditions(provider, pactAddress)
        const currentDate = new Date(conditions.endDateUtc.toNumber())
        setPledgeAmount(conditions.minPledge)
        setEndDate(currentDate.toLocaleDateString())
        setTotalMiles(conditions.totalMiles)
        setTotalMiles(conditions.totalMiles.toNumber())
        setDaysPerCheck(conditions.daysPerCheck.toNumber())
        const res = await getProgress(provider, pactAddress)
        console.log(res)
        setProgress(res.progress)
        setPledges(res.pledges)

        // (minPledge, totalMiles, endDateUtc, daysPerCheck)
        // const [curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck] = conditions;
        // console.log("conditions:", curPledgeAmount, curTotalMiles, curEndDate, curDaysPerCheck);

        // Check if pledge made using queryFilter? Then grey out pledge button?
      } catch (e) {
        console.log(e)
      } finally {
        setInitialized(true)
      }
    };
    if (!initialized) {
      setup(provider, pactAddress)
    }
  }, [pactAddress, provider, signedInAddress])

  const submitChangeConditions = async () => {
    try {
      await setConditions(provider, pactAddress, pledgeAmount, totalMiles, Date.parse(endDate), daysPerCheck)
    } catch (e) {
      console.log(e)
    }
  }

  const handleStartPact = async (provider, pactAddress) => {
    await startPact(provider, pactAddress)
    const { hostAddress, pactState } = await getPactState(provider, pactAddress)
    setPactState(pactState)
    if (ethers.utils.getAddress(hostAddress) === ethers.utils.getAddress(signedInAddress)) {
      setIsHost(true)
    }
  }

  const handleMakePledge = async (provider, pactAddress) => {
    await makePledge(pledgeAmount, provider, pactAddress)
    setTimeout(async () => {
      const res = await getProgress(provider, pactAddress)
      console.log(res)
      setProgress(res.progress)
      setPledges(res.pledges)
    }, 1000)
  }

  const handleGetProgress = async (provider, pactAddress) => {
    const progress = await getProgress(provider, pactAddress)
    console.log(progress)
    setProgress(progress)
  }

  return (
    <>
      <>
        <Header>Pact is {PACT_STATE[pactState]}</Header>
        <br/>
        <PledgeView pledges={pledges}/>
      </>
      {pactState === 0
        ? (
          <>
            <Modal
              title="Creating Pact"
              onClose={() =>
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
              ? (
                <>
                  <Button style={{ marginTop: '8px' }} onClick={() => setShow(true)}>
                    Change Conditions
                  </Button>
                  <Button style={{ marginTop: '8px' }} onClick={() => handleMakePledge(provider, pactAddress)} >Make Pledge</Button>
                  <Button style={{ marginTop: '8px' }} onClick={() => handleStartPact(provider, pactAddress)}>
                    Start Running!
                  </Button>
                </>
              )
              : <>
                <div>
                Participant the pact is pending
                </div>
                <Button style={{ marginTop: '8px' }} onClick={() => handleMakePledge(provider, pactAddress)} >Make Pledge</Button>
              </>
            }
          </>
        )
        : null
      }
      {pactState === 1
        ? <>
          <ProgressView progress={progress}/>
          <Button style={{ marginTop: '8px' }} onClick={() => handleGetProgress(provider, pactAddress)}>Get Progress</Button>
        </>
        : null
      }
      <>
        <Button style={{ marginTop: '8px' }}>
          <a href={STRAVA_URL} target="_self">Link Strava</a>
        </Button>
      </>
    </>
  )
}

export default PactView
