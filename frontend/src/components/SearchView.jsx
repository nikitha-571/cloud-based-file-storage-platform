import { useState } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { fileAPI } from '../services/api';
import FileList from './FileList';
import LoadingSpinner from './LoadingSpinner';

const SearchView = ({ viewMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const response = await fileAPI.searchFiles({ q: searchQuery });
      setSearchResults(response.data);
      
      if (response.data.length === 0) {
        toast.info('No files found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" text="Searching..." />
        </div>
      ) : searchResults.length > 0 ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Found {searchResults.length} result(s)
          </p>
          <FileList
            files={searchResults}
            folders={[]}
            viewMode={viewMode}
            onDelete={() => {}}
            onToggleStar={() => {}}
          />
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Enter a search query to find files</p>
        </div>
      )}
    </div>
  );
};

export default SearchView;