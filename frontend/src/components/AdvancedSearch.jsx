import { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, SlidersHorizontal, File, Folder } from 'lucide-react';
import { filesAPI, foldersAPI } from '../services/api';
import toast from 'react-hot-toast';

function AdvancedSearch({ onSearch, onClear }) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState({ files: [], folders: [] });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  const [filters, setFilters] = useState({
    fileType: '',
    minSize: '',
    maxSize: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });


  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions({ files: [], folders: [] });
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 300); 

    return () => clearTimeout(timeoutId);
  }, [query]);

  
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

 
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions) return;

      const totalItems = suggestions.files.length + suggestions.folders.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSuggestionClick(getSelectedItem());
          } else {
            handleSearch(e);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, selectedIndex, suggestions]);

  const fetchSuggestions = async (searchQuery) => {
    setLoadingSuggestions(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        filesAPI.search(searchQuery, { sortBy: 'name', sortOrder: 'asc' }),
        foldersAPI.search(searchQuery)
      ]);

      setSuggestions({
        files: filesRes.data.slice(0, 5),
        folders: foldersRes.data.slice(0, 5)
      });
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Suggestion error:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getSelectedItem = () => {
    const totalFolders = suggestions.folders.length;
    if (selectedIndex < totalFolders) {
      return { type: 'folder', item: suggestions.folders[selectedIndex] };
    } else {
      return { type: 'file', item: suggestions.files[selectedIndex - totalFolders] };
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'folder') {
      toast.info(`Folder: ${suggestion.item.name}`);
    } else {
      setQuery(suggestion.item.name);
      onSearch(suggestion.item.name, filters);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!query.trim() && !filters.fileType && !filters.minSize && !filters.maxSize) {
      toast.error('Please enter a search query or apply filters');
      return;
    }

    onSearch(query, filters);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    setFilters({
      fileType: '',
      minSize: '',
      maxSize: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    setShowFilters(false);
    setShowSuggestions(false);
    setSuggestions({ files: [], folders: [] });
    onClear();
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (e.target.value.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
      ) : (
        part
      )
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fileTypes = [
    { value: '', label: 'All Types' },
    { value: 'image/', label: 'Images' },
    { value: 'application/pdf', label: 'PDFs' },
    { value: 'video/', label: 'Videos' },
    { value: 'audio/', label: 'Audio' },
    { value: 'text/', label: 'Text Files' },
    { value: 'application/', label: 'Documents' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Date' },
    { value: 'size', label: 'Size' },
    { value: 'type', label: 'Type' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <form onSubmit={handleSearch}>
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
              placeholder="Search files and folders... "
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {showSuggestions && (suggestions.files.length > 0 || suggestions.folders.length > 0 || loadingSuggestions) && (
              <div 
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
              >
                {loadingSuggestions ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm mt-2">Searching...</p>
                  </div>
                ) : (
                  <>
                    {suggestions.folders.length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                          Folders ({suggestions.folders.length})
                        </div>
                        {suggestions.folders.map((folder, index) => (
                          <button
                            key={`folder-${folder.id}`}
                            type="button"
                            onClick={() => handleSuggestionClick({ type: 'folder', item: folder })}
                            className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-blue-50 transition text-left ${
                              selectedIndex === index ? 'bg-blue-100' : ''
                            }`}
                          >
                            <Folder className="text-blue-500 shrink-0" size={18} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {highlightMatch(folder.name, query)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(folder.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Files Section */}
                    {suggestions.files.length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                          Files ({suggestions.files.length})
                        </div>
                        {suggestions.files.map((file, index) => {
                          const actualIndex = suggestions.folders.length + index;
                          return (
                            <button
                              key={`file-${file.id}`}
                              type="button"
                              onClick={() => handleSuggestionClick({ type: 'file', item: file })}
                              className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-green-50 transition text-left ${
                                selectedIndex === actualIndex ? 'bg-green-100' : ''
                              }`}
                            >
                              <File className="text-green-500 shrink-0" size={18} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {highlightMatch(file.name, query)}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{formatFileSize(file.file_size)}</span>
                                  <span>•</span>
                                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {(suggestions.files.length === 5 || suggestions.folders.length === 5) && (
                      <div className="px-4 py-2 bg-gray-50 border-t text-center">
                        <button
                          type="submit"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Show all results for "{query}"
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {showSuggestions && !loadingSuggestions && query.trim().length >= 2 && 
             suggestions.files.length === 0 && suggestions.folders.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
                <p className="text-gray-500 text-sm">No results found for "{query}"</p>
                <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              showFilters ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <SlidersHorizontal size={20} />
            Filters
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Search
          </button>

          {(query || filters.fileType || filters.minSize || filters.maxSize) && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
            >
              <X size={20} />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Type
              </label>
              <select
                value={filters.fileType}
                onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fileTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Size (MB)
              </label>
              <input
                type="number"
                value={filters.minSize ? filters.minSize / (1024 * 1024) : ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  minSize: e.target.value ? e.target.value * 1024 * 1024 : '' 
                })}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Size (MB)
              </label>
              <input
                type="number"
                value={filters.maxSize ? filters.maxSize / (1024 * 1024) : ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  maxSize: e.target.value ? e.target.value * 1024 * 1024 : '' 
                })}
                placeholder="Unlimited"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setFilters({ 
                    ...filters, 
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                  })}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
        
      </div>
    </div>
  );
}

export default AdvancedSearch;