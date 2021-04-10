import React, { useEffect } from 'react'

const CreationForm = ({
  pledgeAmount,
  setPledgeAmount,
  totalMiles,
  setTotalMiles,
  endDate,
  setEndDate,
  daysPerCheck,
  setDaysPerCheck,
  inviteCode,
  setInviteCode
}) => {
  return (
    <form>
      <label>
        Invite code:
        <input
          name="inviteCode"
          type="text"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value) }
        >
        </input>
      </label>
    </form>
  )
}

export default CreationForm
