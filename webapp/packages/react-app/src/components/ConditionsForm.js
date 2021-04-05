import React, {useState, useEffect} from "react";

const ConditionsForm = ({pledgeAmount, setPledgeAmount, endDate, setEndDate, daysPerCheck, setDaysPerCheck}) =>{

  return(
    <form>
      <label>
        Amount:
        <input
        name="pledgeAmount"
        type="number"
        value={pledgeAmount}
        onChange={e => setPledgeAmount(e.target.value) }
        >
        </input>
      </label>
      <br/>
      <label>
        End Date:
        <input
        name="endDate"
        type="number"
        value={endDate}
        onChange={e => setEndDate(e.target.value) }
        >
        </input>
      </label>
      <br/>
      <label>
        Days per check-in:
        <input
        name="daysPerCheck"
        type="number"
        value={daysPerCheck}
        onChange={e => setDaysPerCheck(e.target.value) }
        >
        </input>
      </label>
    </form>
  )
}

export default ConditionsForm;