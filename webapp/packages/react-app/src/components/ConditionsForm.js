import React, { useEffect } from 'react';
import { ethers } from 'ethers';
import { TextField } from '@material-ui/core';

const ConditionsForm = ({
  pledgeAmount,
  setPledgeAmount,
  totalMiles,
  setTotalMiles,
  endDate,
  setEndDate,
  daysPerCheck,
  setDaysPerCheck
}) => {
  return (
    <form>
      <TextField
        label="Enter pledge amount"
        name="pledgeAmount"
        type="number"
        variant="filled"
        InputLabelProps={{
          style: { color: '#afafb3' }
        }}
        inputProps={{
          style: { color: 'white' }
        }}
        fullWidth={true}
        value={pledgeAmount}
        onChange={e => setPledgeAmount(e.target.value) }
      >
      </TextField>
      <br/>
      <TextField
        label="Enter total miles"
        name="totalMiles"
        type="number"
        variant="filled"
        InputLabelProps={{
          style: { color: '#afafb3' }
        }}
        inputProps={{
          style: { color: 'white' }
        }}
        fullWidth={true}
        value={totalMiles}
        onChange={e => setTotalMiles(e.target.value) }
      >
      </TextField>
      <br/>
      <TextField
        label="Enter end date"
        name="endDate"
        type="text"
        variant="filled"
        InputLabelProps={{
          style: { color: '#afafb3' }
        }}
        inputProps={{
          style: { color: 'white' }
        }}
        fullWidth={true}
        value={endDate}
        onChange={e => setEndDate(e.target.value) }
      >
      </TextField>
      <br/>
      <TextField
        label="Enter days per check"
        name="daysPerCheck"
        type="number"
        variant="filled"
        InputLabelProps={{
          style: { color: '#afafb3' }
        }}
        inputProps={{
          style: { color: 'white' }
        }}
        fullWidth={true}
        value={daysPerCheck}
        onChange={e => setDaysPerCheck(e.target.value) }
      >
      </TextField>
    </form>
  )
}

export default ConditionsForm
