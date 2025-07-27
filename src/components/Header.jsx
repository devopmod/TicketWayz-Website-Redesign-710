import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {FiMenu} from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import SideMenu from './SideMenu';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 h-11 flex items-center px-4 fixed w-full z-50">
      <div className="container mx-auto max-w-[960px] flex justify-between items-center h-full">
        <Link to="/" className="text-lg font-bold flex items-center h-full">
          TicketWayz
        </Link>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
          aria-label="Open menu"
        >
          <SafeIcon icon={FiMenu} className="w-5 h-5" />
        </button>
      </div>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}

export default Header;