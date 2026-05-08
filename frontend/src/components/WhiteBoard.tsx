import React from "react";
import "../styles/whiteboard.scss";

export default function WhiteBoard() {
  let isPdf = true;
  return (
    <div className="whiteboard-container">
      {isPdf && (
        <div className="pdf-pagination">
          <div className="btn--outline--black">1</div>
          <div className="btn--outline--black">2</div>
          <div className="btn--outline--black">3</div>
          <div className="btn--outline--black">4</div>
        </div>
      )}

      <div className="content-container"></div>
    </div>
  );
}
