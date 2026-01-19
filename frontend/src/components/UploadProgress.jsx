import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

function UploadProgress({ uploads, onRemove }) {
  if (!uploads || uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Uploads</h3>
        <span className="text-sm text-gray-500">{uploads.length} file(s)</span>
      </div>

      <div className="p-4 space-y-3">
        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="border border-gray-200 rounded-lg p-3 bg-gray-50"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-1">
                {upload.status === 'uploading' && (
                  <Loader className="animate-spin text-blue-500" size={20} />
                )}
                {upload.status === 'success' && (
                  <CheckCircle className="text-green-500" size={20} />
                )}
                {upload.status === 'error' && (
                  <AlertCircle className="text-red-500" size={20} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.fileName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {upload.status === 'uploading' && `${upload.progress}%`}
                  {upload.status === 'success' && 'Upload complete'}
                  {upload.status === 'error' && upload.error}
                </p>

                {upload.status === 'uploading' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {upload.status !== 'uploading' && (
                <button
                  onClick={() => onRemove(upload.id)}
                  className="shrink-0 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UploadProgress;