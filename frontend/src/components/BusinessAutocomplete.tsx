import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, User, Mail, Phone, Plus, Globe, Building } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Business {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  tax_id?: string;
  invoice_count: number;
}

interface BusinessAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBusinessSelect?: (business: Business) => void;
  placeholder?: string;
  className?: string;
}

const BusinessAutocomplete: React.FC<BusinessAutocompleteProps> = ({
  value,
  onChange,
  onBusinessSelect,
  placeholder = "Click to select a business...",
  className = ""
}) => {
  const { user } = useAuth();
  const userId = user?.id || user?.user_id;
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [businessLimit, setBusinessLimit] = useState(2);
  const [currentBusinessCount, setCurrentBusinessCount] = useState(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle create business redirect
  const handleCreateBusiness = () => {
    setIsOpen(false);
    navigate('/businesses');
  };

  // Fetch all businesses for the user
  const fetchBusinesses = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        user_id: userId
      });
      
      const response = await fetch(`${API_BASE_URL}api/businesses?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBusinesses(data.businesses);
        setBusinessLimit(2); // Fixed limit of 2 businesses
        setCurrentBusinessCount(data.businesses.length);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change (just update the value, don't search)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Handle focus - show all businesses
  const handleFocus = () => {
    fetchBusinesses();
    setIsOpen(true);
  };

  // Handle business selection
  const handleBusinessSelect = (business: Business) => {
    const businessText = `${business.name}${business.email ? ` (${business.email})` : ''}`;
    onChange(businessText);
    setIsOpen(false);
    onBusinessSelect?.(business);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isOpen && businesses.length > 0) {
      handleBusinessSelect(businesses[0]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={1}
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Loading businesses...
            </div>
          ) : businesses.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No businesses found. Create your first business to get started.
            </div>
          ) : (
            <>
              {/* Business List */}
              <div className="py-1">
                {businesses.map((business) => (
                  <button
                    key={business.id}
                    onClick={() => handleBusinessSelect(business)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                          <Building className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {business.name}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {business.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              <span className="truncate">{business.email}</span>
                            </div>
                          )}
                          {business.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{business.phone}</span>
                            </div>
                          )}
                          {business.website && (
                            <div className="flex items-center">
                              <Globe className="h-3 w-3 mr-1" />
                              <span className="truncate">{business.website}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {business.invoice_count || 0} invoices
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Business Limit Info */}
              <div className="px-4 py-2 border-t border-neutral-600 bg-neutral-750">
                <div className="text-xs text-neutral-400 mb-2">
                  {currentBusinessCount}/{businessLimit} businesses used
                </div>
                <button
                  onClick={handleCreateBusiness}
                  className="w-full flex items-center justify-center px-3 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={14} className="mr-2" />
                  Create New Business
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BusinessAutocomplete; 