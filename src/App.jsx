import { NavLink, Outlet } from 'react-router-dom';

export default function App() {
  const tabClass = ({ isActive }) => 'tab' + (isActive ? ' active' : '');
  return (
    <>
      <nav className="nav">
        <span className="brand">
          <img className="mark-img" src={`${import.meta.env.BASE_URL}relatum-icon-512.png`} alt="" />
          Relatum
        </span>
        <NavLink to="/" end className={tabClass}>Summary</NavLink>
        <NavLink to="/protocol/aave" className={tabClass}>Aave v3 (worked example)</NavLink>
        <NavLink to="/methodology" className={tabClass}>Methodology</NavLink>
        <span className="spacer"></span>
      </nav>
      <Outlet />
    </>
  );
}
