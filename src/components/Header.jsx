import React,{useState,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {FiMenu} from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import SideMenu from './SideMenu';

const Header=()=> {
  const [isMenuOpen,setIsMenuOpen]=useState(false);
  const [siteName,setSiteName]=useState('TicketWayz');

  // Load site name from settings
  useEffect(()=> {
    const loadSiteName=()=> {
      try {
        const savedSettings=localStorage.getItem('siteSettings');
        if (savedSettings) {
          const settings=JSON.parse(savedSettings);
          if (settings.siteName) {
            setSiteName(settings.siteName);
          }
        }
      } catch (error) {
        console.error('Error loading site name:',error);
      }
    };

    loadSiteName();

    // Listen for storage changes to update site name in real-time
    const handleStorageChange=(e)=> {
      if (e.key==='siteSettings') {
        loadSiteName();
      }
    };

    window.addEventListener('storage',handleStorageChange);
    
    // Also listen for custom events from the same tab
    const handleSettingsUpdate=()=> {
      loadSiteName();
    };
    
    window.addEventListener('settingsUpdated',handleSettingsUpdate);

    return ()=> {
      window.removeEventListener('storage',handleStorageChange);
      window.removeEventListener('settingsUpdated',handleSettingsUpdate);
    };
  },[]);

  return (
    <header className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 h-11 flex items-center px-4 fixed w-full z-50">
      <div className="container mx-auto max-w-[960px] flex justify-between items-center h-full">
        <Link to="/" className="text-lg font-bold flex items-center h-full">
          {siteName}
        </Link>
        <button
          onClick={()=> setIsMenuOpen(true)}
          className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
          aria-label="Open menu"
        >
          <SafeIcon icon={FiMenu} className="w-5 h-5" />
        </button>
      </div>
      <SideMenu isOpen={isMenuOpen} onClose={()=> setIsMenuOpen(false)} />
    </header>
  );
};

export default Header;