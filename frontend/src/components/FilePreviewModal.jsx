import { useState, useEffect } from 'react';
import { 
  X, Download, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RotateCw, Star, Loader2,
  FileText, Film, Music, File as FileIcon, Maximize2, Minimize2
} from 'lucide-react';
import { filesAPI } from '../services/api';
import toast from 'react-hot-toast';

function FilePreviewModal({ 
  fileId, 
  onClose, 
  onNext, 
  onPrevious, 
  hasNext, 
  hasPrevious,
  onToggleStar 
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState('contain'); 

  useEffect(() => {
    loadFilePreview();
  }, [fileId]);

  const loadFilePreview = async () => {
    setLoading(true);
    try {
      const response = await filesAPI.getPreview(fileId);
      setFile(response.data);
      setZoom(100);
      setRotation(0);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to load preview');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (file?.preview_url) {
      window.open(file.preview_url, '_blank');
      toast.success('Download started');
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const toggleFitMode = () => {
    setFitMode(prev => prev === 'contain' ? 'fill' : 'contain');
    setZoom(100); 
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderPreview = () => {
    if (!file) return null;

    const { file_type, preview_url, name } = file;

    // Image Preview
    if (file_type.startsWith('image/')) {
      if (fitMode === 'contain') {
        return (
          <div className="flex items-center justify-center flex-1 bg-gray-900 p-4">
            <img
              src={preview_url}
              alt={name}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              className="select-none"
            />
          </div>
        );
      } else {
        return (
          <div className="flex-1 bg-gray-900 overflow-auto flex items-center justify-center p-4">
            <div className="inline-block">
              <img
                src={preview_url}
                alt={name}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                  transformOrigin: 'center center'
                }}
                className="select-none block"
              />
            </div>
          </div>
        );
      }
    }

    // PDF Preview
    if (file_type === 'application/pdf') {
      return (
        <div className="flex-1 overflow-hidden bg-gray-800">
          <iframe
            src={`${preview_url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={name}
            style={{ minHeight: '600px' }}
          />
        </div>
      );
    }

    // Word Documents - Cannot be previewed
    if (file_type.includes('word') || 
        file_type.includes('document') ||
        file_type === 'application/msword' ||
        file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return (
        <div className="flex flex-col items-center justify-center flex-1 bg-gray-100 p-8">
          <FileText className="text-blue-500 mb-4" size={80} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Word Document Preview Not Available
          </h3>
          <p className="text-gray-500 mb-4 text-center max-w-md">
            Word documents cannot be previewed in the browser. Please download to view.
          </p>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download size={20} />
            Download to View
          </button>
        </div>
      );
    }

    // Video Preview
    if (file_type.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center flex-1 bg-black p-4">
          <video
            src={preview_url}
            controls
            className="max-w-full max-h-full"
            style={{ maxHeight: '70vh' }}
          >
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    // Audio Preview
    if (file_type.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 bg-gray-900 p-8">
          <Music className="text-white mb-6" size={80} />
          <h3 className="text-white text-xl mb-6">{name}</h3>
          <audio src={preview_url} controls className="w-full max-w-md">
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    // Text File Preview
    if (file_type.startsWith('text/') || file_type === 'application/json') {
      return <TextFilePreview url={preview_url} />;
    }

    // Unsupported file type
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-gray-100 p-8">
        <FileIcon className="text-gray-400 mb-4" size={80} />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Preview not available
        </h3>
        <p className="text-gray-500 mb-4">
          This file type cannot be previewed in the browser
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download size={20} />
          Download File
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-white flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={48} />
          <p>Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!file) return null;

  const isImage = file.file_type.startsWith('image/');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{file.name}</h2>
          <span className="text-sm text-gray-400">
            {formatFileSize(file.file_size)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Image Controls */}
          {isImage && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-700 rounded transition"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>
              <span className="text-sm px-2">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-700 rounded transition"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 hover:bg-gray-700 rounded transition"
                title="Rotate"
              >
                <RotateCw size={20} />
              </button>
              <button
                onClick={toggleFitMode}
                className={`p-2 rounded transition ${
                  fitMode === 'contain' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title={fitMode === 'contain' ? 'Switch to Full Size' : 'Switch to Fit Screen'}
              >
                {fitMode === 'contain' ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
              </button>
              <div className="w-px h-6 bg-gray-600 mx-2" />
            </>
          )}

          {/* Star */}
          <button
            onClick={() => onToggleStar && onToggleStar(fileId)}
            className="p-2 hover:bg-gray-700 rounded transition"
            title={file.is_starred ? "Unstar" : "Star"}
          >
            <Star
              size={20}
              className={file.is_starred ? "fill-yellow-400 text-yellow-400" : ""}
            />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-700 rounded transition"
            title="Download"
          >
            <Download size={20} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative flex min-h-0">
        {/* Previous Button */}
        {hasPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-gray-900 bg-opacity-75 hover:bg-opacity-100 text-white p-3 rounded-full transition"
            title="Previous File"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Preview */}
        {renderPreview()}

        {/* Next Button */}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-gray-900 bg-opacity-75 hover:bg-opacity-100 text-white p-3 rounded-full transition"
            title="Next File"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-900 text-white p-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span>Type: {file.file_type}</span>
          <span>
            Created: {new Date(file.created_at).toLocaleDateString()}
          </span>
          {isImage && (
            <span className="text-blue-400">
              Mode: {fitMode === 'contain' ? 'Fit to Screen' : 'Full Size (Scrollable)'}
            </span>
          )}
        </div>
        {(hasNext || hasPrevious) && (
          <div className="text-gray-400">
            Use arrow keys to navigate
          </div>
        )}
      </div>
    </div>
  );
}

// Text File Preview Component
function TextFilePreview({ url }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent('Failed to load file content');
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 bg-white">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white p-6">
      <pre className="text-sm font-mono whitespace-pre-wrap wrap-break-word">
        {content}
      </pre>
    </div>
  );
}

export default FilePreviewModal;