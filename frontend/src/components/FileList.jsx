import { FileText, Image, Film, Music, FileArchive, File, Folder, Star, Download, Trash2, Share,
  Eye, FileSpreadsheet, Presentation, Clock, Tag as TagIcon , CheckSquare, Square} from 'lucide-react';
import { useState } from 'react';
import { filesAPI } from '../services/api';

const FileList = ({ 
  files = [], 
  folders = [], 
  viewMode, 
  onDelete, 
  onToggleStar, 
  onFolderClick,
  onPreview,
  onShare,
  onEditTags,
  isSearching,
  onVersionHistory ,
  selectionMode = false,
  selectedFiles = [],
  selectedFolders = [],
  onToggleFileSelection,
  onToggleFolderSelection
}) => {
  const [activeMenu, setActiveMenu] = useState(null);

  if (!Array.isArray(files)) {
    console.error('files prop is not an array:', files);
    return <div className="text-red-500 p-4">Error: Invalid files data</div>;
  }

  if (!Array.isArray(folders)) {
    console.error('folders prop is not an array:', folders);
    return <div className="text-red-500 p-4">Error: Invalid folders data</div>;
  }

  const getFileIcon = (fileType, fileName = '') => {
    const name = fileName.toLowerCase();
    if (fileType?.startsWith('image') || name.match(/\.(jpg|jpeg|png|gif|webp)$/))
      return <Image className="h-5 w-5 text-blue-500" />;
    if (fileType?.startsWith('video') || name.match(/\.(mp4|mov|avi|mkv)$/))
      return <Film className="h-5 w-5 text-purple-500" />;
    if (fileType?.startsWith('audio') || name.match(/\.(mp3|wav|ogg)$/))
      return <Music className="h-5 w-5 text-pink-500" />;
    if (fileType?.includes('pdf') || name.endsWith('.pdf'))
      return <FileText className="h-5 w-5 text-red-500" />;
    if (
      fileType?.includes('msword') ||
      fileType?.includes('wordprocessingml') ||
      name.match(/\.(doc|docx)$/)
    ) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    if (
      fileType?.includes('excel') ||
      fileType?.includes('spreadsheetml') ||
      name.match(/\.(xls|xlsx)$/)
    ) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    }
    if (
      fileType?.includes('powerpoint') ||
      fileType?.includes('presentationml') ||
      name.match(/\.(ppt|pptx)$/)
    ) {
      return <Presentation className="h-5 w-5 text-orange-600" />;
    }
    if (
      fileType?.includes('zip') ||
      fileType?.includes('compressed') ||
      name.match(/\.(zip|rar|7z|tar|gz)$/)
    ) {
      return <FileArchive className="h-5 w-5 text-gray-800" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isPreviewable = (fileType) => {
    return fileType?.startsWith('image/') || 
           fileType?.startsWith('video/') || 
           fileType?.startsWith('audio/') ||
           fileType === 'application/pdf' ||
           fileType?.startsWith('text/') ||
           fileType === 'application/json';
  };

  const isDownloadOnly = (fileType) => {
    return fileType?.includes('docx') || 
           fileType?.includes('document') ||
           fileType === 'application/docx' ||
           fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           fileType?.includes('xlsx') ||
           fileType?.includes('spreadsheet') ||
           fileType?.includes('pptx') ||
           fileType?.includes('presentation');
  };

  const handlePreviewClick = async (file, e) => {
    e.stopPropagation();
    
    if (isDownloadOnly(file.file_type)) {
      if (confirm(`"${file.name}" cannot be previewed in browser.\n\nWould you like to download it to view?`)) {
        handleDownload(file.id, file.name);
      }
    } else {
      onPreview(file.id);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await filesAPI.getDownloadUrl(fileId);
      const downloadUrl = response.data.download_url;
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Folder className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No files or folders</p>
        <p className="text-sm">Upload a file or create a folder to get started</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Folders */}
        {folders.map((folder) => (
          <div
            key={`folder-${folder.id}`}
            onClick={() => {
              if (!isSearching && !selectionMode) {
                onFolderClick(folder.id);
              }
            }}
            className={`bg-white border-2 rounded-lg p-4 pb-12 hover:shadow-md transition cursor-pointer group relative ${
              selectionMode && selectedFolders.includes(folder.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-400'
            }`}
          > 
            {selectionMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFolderSelection(folder.id);
                }}
                className="absolute top-2 left-2 z-10"
              >
                {selectedFolders.includes(folder.id) ? (
                  <CheckSquare size={24} className="text-blue-600" />
                ) : (
                  <Square size={24} className="text-gray-400" />
                )}
              </button>
            )}
            <div className="flex flex-col items-center text-center">
              <Folder className="h-12 w-12 text-blue-500 mb-2" />
              <p className="text-sm font-medium text-gray-900 truncate w-full">
                {folder.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(folder.created_at)}</p>
            </div>
            
            {/* Folder Actions */}
            {!selectionMode && (
              <div className="absolute bottom-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(folder.id, 'folder');
                  }}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Files */}
        {files.map((file) => (
          <div
            key={`file-${file.id}`}
            className={`bg-white border-2 rounded-lg p-4 pb-12 hover:shadow-md transition relative group ${
              selectionMode && selectedFiles.includes(file.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-green-400'
            }`}
            onDoubleClick={() => !selectionMode && isPreviewable(file.file_type) && onPreview(file.id)}
          >
            {selectionMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFileSelection(file.id);
                }}
                className="absolute top-2 left-2 z-10"
              >
                {selectedFiles.includes(file.id) ? (
                  <CheckSquare size={24} className="text-blue-600" />
                ) : (
                  <Square size={24} className="text-gray-400" />
                )}
              </button>
            )}

            {!selectionMode && onVersionHistory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVersionHistory(file);
                }}
                className="absolute top-2 left-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition hover:bg-gray-100 z-10"
                title="Version History"
              >
                <Clock size={16} className="text-indigo-500" />
              </button>
            )}

            {!selectionMode && (
              <>
                {onEditTags && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTags(file);
                    }}
                    className="absolute top-2 right-12 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition hover:bg-gray-100 z-10"
                    title="Edit Tags"
                  >
                    <TagIcon size={16} className="text-indigo-600" />
                  </button>
                )}
                <button
                  onClick={(e) => handlePreviewClick(file, e)}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition hover:bg-gray-100 z-10"
                  title={isDownloadOnly(file.file_type) ? "Download to view" : "Preview"}
                >
                  <Eye size={16} className={isDownloadOnly(file.file_type) ? "text-orange-600" : "text-purple-600"} />
                </button>
              </>
            )}

            <div className="flex flex-col items-center text-center">
              {getFileIcon(file.file_type, file.name)}
              
              <div className="w-full mt-2">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate flex-1">
                    {file.name}
                  </p>
                  {file.is_starred && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                  )}
                </div>
                
                {/* Tags */}
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {file.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 rounded-full text-xs text-white"
                        style={{ backgroundColor: tag.color }}
                        title={tag.name}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.file_size)}</p>
              <p className="text-xs text-gray-400">{formatDate(file.created_at)}</p>
            </div>

            {/* Action Buttons */}
            {!selectionMode && (
              <div className="absolute bottom-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(file.id, file.name);
                  }}
                  className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare && onShare(file);
                  }}
                  className="text-purple-500 hover:text-purple-700 p-1 hover:bg-purple-50 rounded"
                  title="Share"
                >
                  <Share size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(file.id);
                  }}
                  className="text-yellow-500 hover:text-yellow-600 p-1 hover:bg-yellow-50 rounded"
                  title={file.is_starred ? "Unstar" : "Star"}
                >
                  <Star size={16} className={file.is_starred ? "fill-yellow-500" : ""} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(file.id, 'file');
                  }}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // List View
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tags
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Modified
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Folders */}
          {folders.map((folder) => (
            <tr
              key={`folder-${folder.id}`}
              onClick={() => !isSearching && !selectionMode && onFolderClick(folder.id)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Folder className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">{folder.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(folder.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(folder.id, 'folder');
                  }}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}

          {/* Files */}
          {files.map((file) => (
            <tr 
              key={`file-${file.id}`} 
              className="hover:bg-gray-50"
              onDoubleClick={() => isPreviewable(file.file_type) && onPreview(file.id)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {onVersionHistory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVersionHistory(file);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Version History"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                  )}

                  {getFileIcon(file.file_type, file.name)}
                  <span className="ml-3 text-sm font-medium text-gray-900">{file.name}</span>
                  {file.is_starred && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {file.tags && file.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 rounded-full text-xs text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(file.file_size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(file.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {onEditTags && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTags(file);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit Tags"
                    >
                      <TagIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => handlePreviewClick(file, e)}
                    className={isDownloadOnly(file.file_type) ? "text-orange-600 hover:text-orange-900" : "text-purple-600 hover:text-purple-900"}
                    title={isDownloadOnly(file.file_type) ? "Download to view" : "Preview"}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file.id, file.name);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(file);
                    }}
                    className="text-purple-600 hover:text-purple-900"
                    title="Share"
                  >
                    <Share className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(file.id);
                    }}
                    className="text-gray-400 hover:text-yellow-500"
                    title={file.is_starred ? "Unstar" : "Star"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        file.is_starred ? 'fill-yellow-400 text-yellow-400' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(file.id, 'file');
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;