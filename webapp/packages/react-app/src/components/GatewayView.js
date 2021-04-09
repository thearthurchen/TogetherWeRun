import React, { useState } from 'react'
import Modal from './Modal.js'
import { Button, Image } from '.'
import { ethers } from 'ethers'
import { getMyPact, createPact, setConditions, joinPact } from '../contractFunctions.js'
import CreationForm from './CreationForm'

const GatewayView = ({ provider, setPactAddress, signedInAddress, logo }) => {
  const [show, setShow] = useState(false)
  const [pledgeAmount, setPledgeAmount] = useState(1)
  const [endDate, setEndDate] = useState('4/10/21')
  const [daysPerCheck, setDaysPerCheck] = useState(1)
  const [totalMiles, setTotalMiles] = useState(40)
  const [inviteCode, setInviteCode] = useState('')

  const submitCreatePact = async (provider, pledgeAmount, totalMiles, endDate, daysPerCheck) => {
    // console.log(pledgeAmount, endDate, daysPerCheck);
    // TODO: create and set unique invite code
    try {
      const pactAddress = await createPact(provider, 'hello')
      console.log(pactAddress, signedInAddress)
      await setConditions(provider, pactAddress, pledgeAmount, totalMiles, Date.parse(endDate), daysPerCheck)
      setPactAddress(pactAddress)
    } catch (e) {
      console.log(e)
    }
  }

  const handleJoinPact = async (provider, hostAddress, inviteCode) => {
    const pactAddress = await joinPact(provider, ethers.utils.getAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'), 'hello')
    console.log(pactAddress)
    setPactAddress(pactAddress)
  }

  return (
    <>
      Gateway
      <Modal title="Creating Pact" onClose={() => setShow(false)} show={show} onSubmit={() => submitCreatePact(provider, pledgeAmount, totalMiles, endDate, daysPerCheck)}>
        <CreationForm
          pledgeAmount={pledgeAmount} setPledgeAmount={setPledgeAmount}
          totalMiles={totalMiles} setTotalMiles={setTotalMiles}
          endDate={endDate} setEndDate={setEndDate}
          daysPerCheck={daysPerCheck} setDaysPerCheck={setDaysPerCheck}
          invitecode={inviteCode} setInvitecode={setInviteCode}
        />
      </Modal>
      <Button style={{ marginTop: '8px' }} onClick={() => getMyPact(provider)}>
          My Pact
      </Button>
      <Button style={{ marginTop: '8px' }} onClick={() => setShow(true)}>
          Create Pact
      </Button>
      <Button style={{ marginTop: '8px' }} onClick={() => handleJoinPact(provider, '', 'inviteCode')}>
          Join Pact
      </Button>
    </>
  )
}

export default GatewayView
