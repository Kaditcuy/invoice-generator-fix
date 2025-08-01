import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, User, Mail, Phone, Plus } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  invoice_count: number;
}

interface ClientAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onClientSelect?: (client: Client) => void;
  placeholder?: string;
  className?: string;
}

const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({
  value,
  onChange,
  onClientSelect,
  placeholder = "Click to select a client...",
  className = ""
}) => {
  const { user } = useAuth();
  const userId = user?.id || user?.user_id;
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientLimit, setClientLimit] = useState(10);
  const [currentClientCount, setCurrentClientCount] = useState(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle create client redirect
  const handleCreateClient = () => {
    setIsOpen(false);
    navigate('/clients');
  };

  // Fetch all clients for the user
  const fetchClients = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        user_id: userId
      });
      
      const response = await fetch(`${API_BASE_URL}api/clients?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setClients(data.clients);
        setClientLimit(data.client_limit);
        setCurrentClientCount(data.current_count);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change (just update the value, don't search)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Handle focus - show all clients
  const handleFocus = () => {
    fetchClients();
    setIsOpen(true);
  };

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    const clientText = `${client.name}${client.email ? ` (${client.email})` : ''}`;
    onChange(clientText);
    setIsOpen(false);
    onClientSelect?.(client);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          rows={3}
          className="flex lg:w-64 w-full min-h-[100px] p-3 rounded-md bg-neutral-700 border
          border-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder={placeholder}
        />
        <div className="absolute right-2 top-2 flex items-center space-x-1">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
          )}
          <ChevronDown size={16} className="text-neutral-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-neutral-800 border border-neutral-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {clients.length > 0 ? (
            <div className="py-1">
              {clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="px-4 py-2 hover:bg-neutral-700 cursor-pointer flex items-center space-x-3"
                >
                  <div className="flex-shrink-0">
                    <User size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {client.name}
                    </div>
                    {client.email && (
                      <div className="flex items-center text-xs text-neutral-400">
                        <Mail size={12} className="mr-1" />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center text-xs text-neutral-400">
                        <Phone size={12} className="mr-1" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {client.invoice_count} invoices
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-400">
              {loading ? 'Loading clients...' : 'No clients found. Create your first client to get started.'}
            </div>
          )}
          
          {/* Client Limit Info */}
          <div className="px-4 py-2 border-t border-neutral-600 bg-neutral-750">
            <div className="text-xs text-neutral-400 mb-2">
              {currentClientCount}/{clientLimit} clients used
            </div>
            <button
              onClick={handleCreateClient}
              className="w-full flex items-center justify-center px-3 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors"
            >
              <Plus size={14} className="mr-2" />
              Create New Client
            </button>
          </div>
        </div>
      )}

      {/* Limit Reached Dialog */}
      {showLimitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Client Limit Reached
            </h3>
            <p className="text-neutral-300 mb-4">
              You have reached the maximum limit of 10 clients. Please upgrade your plan to add more clients.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLimitDialog(false)}
                className="flex-1 px-4 py-2 bg-neutral-700 text-white rounded-md hover:bg-neutral-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowLimitDialog(false);
                  // TODO: Implement upgrade flow
                  window.open('/upgrade', '_blank');
                }}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAutocomplete; 