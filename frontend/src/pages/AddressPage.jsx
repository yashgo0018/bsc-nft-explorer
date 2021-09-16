import { Component } from "react";
import axios from 'axios';
import Identicon from 'identicon.js';

export default class AddressPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAddressValid: true,
      nfts: [],
      icon: '',
      address: ''
    }
  }
  async componentDidMount() {
    try {
      const { address } = this.props.match.params;

      const { data: nfts } = await axios.get(`http://${location.hostname}:4000/address/${address}`);
      this.setState({ nfts, address });
      const icon = `data:image/png;base64,${new Identicon(address, 100).toString()}`;
      this.setState({ icon })
    } catch (e) {
      console.log(e)
      if (e.response && e.response.status === 400) {
        this.setState({ isAddressValid: false });
      }
    }
  }

  getShortAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(address.length - 8)}`
  }

  render() {
    const { icon, address, nfts, isAddressValid } = this.state;
    if (!isAddressValid) {
      return <div className="text-2xl mt-40 text-center">Invalid Address</div>
    }
    return <div>
      <div className="text-center my-8">
        <img src={icon} className="items-center mx-auto rounded-2xl" width="100" alt="" />
        <div className=" mt-4 text-gray-600 text-md">{this.getShortAddress(address)}</div>
      </div>
      {nfts.length > 0 ? <div className="container mx-auto">
        <div className="text-lg border-b-2 px-2 inline-block border-black">Owned NFTs</div>
        <div className="flex flex-wrap">
          {nfts.map(nft => <div key={nft.id} className="w-1/3 lg:w-1/4 p-2">
            <div className="w-full border-2 border-black">
              <img src={'http://localhost:4000' + nft.image} className="my-auto w-full" alt="" />
              <div className="p-2">
                {nft.name}
              </div>
            </div>
          </div>)}
        </div>
      </div> : <div className="text-center mt-10 text-lg">No NFT Found</div>
      }
    </div>
  }
}