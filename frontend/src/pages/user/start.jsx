
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Start() {


  return (
    <>  
      <section className="h-screen flex items-center justify-center bg-[var(--white-color)]">
        <div className="max-w-[800px] text-[var(--black-color)] flex flex-col items-center z-20 " >
          <h1 className="text-3xl font-bold mb-4">Start</h1>
          <p className="text-lg font-light mb-8">
            inicio de la app
          </p>
        </div>
      </section>
    </>
  );
}


export default Start;