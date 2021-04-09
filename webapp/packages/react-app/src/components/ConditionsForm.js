import React, { useEffect } from "react";

const ConditionsForm = ({pledgeAmount, setPledgeAmount, totalMiles, setTotalMiles, endDate, setEndDate, daysPerCheck, setDaysPerCheck}) =>{

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
        Total Miles:
        <input
        name="totalMiles"
        type="number"
        value={totalMiles}
        onChange={e => setTotalMiles(e.target.value) }
        >
        </input>
      </label>
      <br/>
      <label>
        End Date:
        <input
        name="endDate"
        type="text"
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