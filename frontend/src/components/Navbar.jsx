import { Link } from 'react-router-dom'
import { FaMicrophone, FaListAlt } from 'react-icons/fa'

const Navbar = () => {
  return (
    <nav className="bg-primary-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <FaMicrophone className="text-2xl" />
            <span className="text-xl font-bold">MedChat</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center space-x-1 hover:text-primary-200 transition-colors"
            >
              <FaMicrophone />
              <span>Record</span>
            </Link>
            
            <Link 
              to="/results" 
              className="flex items-center space-x-1 hover:text-primary-200 transition-colors"
            >
              <FaListAlt />
              <span>Results</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar