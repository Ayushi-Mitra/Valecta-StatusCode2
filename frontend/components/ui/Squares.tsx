import React from "react";
import "./Squares.css";

const Squares: React.FC = () => {
  return (
    <div className="squares-bg">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="square" />
      ))}
    </div>
  );
};

export default Squares;
