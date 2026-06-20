import { NavLink, Outlet } from 'react-router-dom';

export default function App() {
  const tabClass = ({ isActive }) => 'tab' + (isActive ? ' active' : '');
  return (
    <>
      <nav className="nav">
        <span className="brand"><span className="mark"><span></span></span>Relatum</span>
        <NavLink to="/" end className={tabClass}>Summary</NavLink>
        <NavLink to="/protocol/aave" className={tabClass}>Aave v3 (worked example)</NavLink>
        <NavLink to="/methodology" className={tabClass}>Methodology</NavLink>
        <span className="spacer"></span>
      </nav>
      <Outlet />
    </>
  );
}
