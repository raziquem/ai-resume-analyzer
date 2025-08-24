import { Link } from "react-router"

const NavBar = () => {
  return (
    <nav className="navbar">
        <Link to='/'>
            <p className="text-2xl font-bold text-gradient">ATSly</p>
        </Link>
        <Link to='/upload' className="primary-button w-fit">Upload resume</Link>
    </nav>
  )
}

export default NavBar