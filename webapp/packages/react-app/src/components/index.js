import styled from "styled-components";

export const Header = styled.header`
  background-color: #282c34;
  min-height: 70px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  color: white;
`;

export const Body = styled.body`
  align-items: center;
  background-color: #282c34;
  color: white;
  display: flex;
  flex-direction: column;
  font-size: calc(10px + 2vmin);
  justify-content: center;
  min-height: calc(100vh - 70px);
`;

export const Image = styled.img`
  height: 40vmin;
  margin-bottom: 16px;
  pointer-events: none;
`;

export const Link = styled.a.attrs({
  target: "_blank",
  rel: "noopener noreferrer",
})`
  color: #61dafb;
  margin-top: 10px;
`;

export const Button = styled.button`
  background-color: white;
  border: none;
  border-radius: 8px;
  color: #282c34;
  cursor: pointer;
  font-size: 16px;
  text-align: center;
  text-decoration: none;
  margin: 0px 20px;
  padding: 12px 24px;

  ${props => props.hidden && "hidden"} :focus {
    border: none;
    outline: none;
  }
`;

export const StyledModal = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease-in-out;
  pointer-events: none;

  &.enter-done {
    opacity: 1;
    pointer-events: visible;
  }

  &.exit {
    opacity: 0;
  }

  &.enter-done .modal-content {
    transform: translateY(0);
  }

  &.exit .modal-content {
    transform: translateY(-200px);
  }

  .modal-content {
    width: 500px;
    background-color: white;
    color: black;
    border-radius: 8px;
    transform: translateY(-200px);
    transition: all 0.3s ease-in-out;
  }

  .modal-header, .modal-footer {
    padding: 10px;
  }

  .modal-body {
    padding: 10px;
    border-top: 1px solid black;
    border-bottom: 1px solid black;
  }
`;

export const StyledTable = styled.table`
  border-collapse: collapse;
  margin: 25px 0;
  font-size: 0.9em;
  font-family: sans-serif;
  min-width: 400px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  overflow: hidden;

  thead tr {
    background-color: #009879;
    color: #ffffff;
    text-align: left;
    font-weight: bold;
  }

  th,
  td {
    padding: 12px 15px;
  }

  tbody tr {
    background-color: grey;
    border-bottom: 1px solid #dddddd;
  }

  tbody tr:nth-of-type(even) {
    background-color: #f3f3f3;
    color: blue;
  }

  tbody tr:last-of-type {
    border-bottom: 2px solid #009879;
}

  tbody tr.active-row {
    font-weight: bold;
    color: #009879;
}
`

// ${props => props.show && 'opacity: 1;'}
// ${props => props.show && 'pointer-events: visible;'}