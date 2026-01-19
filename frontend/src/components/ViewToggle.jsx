import { Grid3x3, List } from 'lucide-react';

function ViewToggle({ view, onViewChange }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onViewChange('grid')}
        className={`p-2 rounded-lg transition ${
          view === 'grid'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="Grid View"
      >
        <Grid3x3 size={20} />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded-lg transition ${
          view === 'list'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="List View"
      >
        <List size={20} />
      </button>
    </div>
  );
}

export default ViewToggle;