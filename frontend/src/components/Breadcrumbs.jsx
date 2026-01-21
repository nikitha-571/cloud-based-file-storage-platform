import { Home, ChevronRight, Folder } from 'lucide-react';

function Breadcrumbs({ breadcrumbs, onNavigate, isSearching }) {
  return (
    <div className="flex items-center gap-2 mb-4 text-sm overflow-x-auto pb-2">
      {/* Home / My Drive */}
      <button
        onClick={() => onNavigate(null)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
          breadcrumbs.length === 0 && !isSearching
            ? 'bg-blue-100 text-blue-600 font-semibold'
            : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        <Home size={16} />
        <span>My Drive</span>
      </button>

      {/* Breadcrumb path */}
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center gap-2">
          <ChevronRight size={16} className="text-gray-400 shrink-0" />
          <button
            onClick={() => onNavigate(crumb.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition max-w-xs ${
              index === breadcrumbs.length - 1 && !isSearching
                ? 'bg-blue-100 text-blue-600 font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            }`}
          >
            <Folder size={16} className="text-blue-500 shrink-0" />
            <span className="truncate">{crumb.name}</span>
          </button>
        </div>
      ))}

      {/* Search indicator */}
      {isSearching && (
        <>
          <ChevronRight size={16} className="text-gray-400 shrink-0" />
          <span className="text-gray-600 italic px-3 py-1.5">Search Results</span>
        </>
      )}
    </div>
  );
}

export default Breadcrumbs;