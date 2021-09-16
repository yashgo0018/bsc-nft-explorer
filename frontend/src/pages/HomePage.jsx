import { useState } from "react";
import { Redirect } from "react-router-dom";

function HomePage() {
  const [addressSubmited, setAddressSubmitted] = useState(false);
  const [address, setAddress] = useState('');

  return <div className="container mx-auto mt-40 flex">
    {addressSubmited && <Redirect to={`/address/${address}`} />}
    <form onSubmit={(e) => { e.preventDefault(); setAddressSubmitted(true) }} class="shadow-md flex w-1/2 mx-auto my-auto text-xl">
      <input class="w-full rounded p-2" type="text" placeholder="Search..." value={address} onChange={(e) => setAddress(e.target.value)} />
      <button class="bg-white w-auto flex justify-end items-center text-blue-500 p-2 hover:text-blue-400">
        <i class="material-icons">search</i>
      </button>
    </form>
  </div>;
}

export default HomePage;