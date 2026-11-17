import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Scenery from './components/Scenery.jsx';
import Stories from './components/Stories.jsx';
import Visit from './components/Visit.jsx';
import Footer from './components/Footer.jsx';
export default function App(){return (<><a className="skip" href="#main">본문으로 이동</a><div className="wrap min-h-screen">
<Header />
<main id="main"><Hero />
<About />
<Scenery />
<Stories />
<Visit /></main>
<Footer /></div>
</>);}
