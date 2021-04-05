import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import { StyledModal } from '.';

const Modal = ({show, onClose, onSubmit, title, children}) => {
  const closeOnEscapeKeyDown = (e) => {
    if ((e.charCode || e.keyCode) === 27) {
      onClose();
    }
  }

  useEffect(() => {
    document.body.addEventListener('keydown', closeOnEscapeKeyDown);
    return function cleanup(){
      document.body.removeEventListener('keydown', closeOnEscapeKeyDown);
    }
  }, [])

  return ReactDOM.createPortal(
    <CSSTransition
      in={show}
      unmountOnExit
      timeout={{ enter: 0, exit: 300}}
    >
      <StyledModal onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h4 className="modal-title">{title}</h4>
            <div className="modal-body">
              {children}
            </div>
            <div className="modal-footer">
              <button onClick={onClose} className="button">Close</button>
              <button onClick={onSubmit} className="button">Submit</button>
            </div>
          </div>
        </div>
      </StyledModal>
    </CSSTransition>,
    document.getElementById('root')
  )
}

export default Modal;
