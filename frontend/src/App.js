import './App.css';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import AddressPage from './pages/AddressPage';
import HomePage from './pages/HomePage';
function App() {
  return (
    <Router>

      <div className="App h-full">
        <Navbar />
        <Switch>
          <Route path="/address/:address" component={AddressPage} exact />
          <Route path="/" component={HomePage} exact />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
