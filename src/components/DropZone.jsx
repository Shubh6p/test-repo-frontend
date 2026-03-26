import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { formatBytes, getFileIcon } from '../utils/helpers';
import { MAX_FILE_SIZE } from '../utils/constants';

export default function DropZone({ onFileSelected, selectedFile, disabled }) {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            if (file.size > MAX_FILE_SIZE) {
                alert(`File too large. Max size: ${formatBytes(MAX_FILE_SIZE)}`);
                return;
            }
            onFileSelected(file);
        }
    }, [onFileSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        disabled
    });

    if (selectedFile) {
        return (
            <div className="border-2 border-green-500/30 bg-green-500/5 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">
                    {getFileIcon(selectedFile.type)}
                </div>
                <p className="text-lg font-semibold text-white">
                    {selectedFile.name}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    {formatBytes(selectedFile.size)}
                </p>
                {!disabled && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFileSelected(null);
                        }}
                        className="mt-4 text-sm text-red-400 hover:text-red-300 underline underline-offset-2"
                    >
                        Remove file
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`
        border-2 border-dashed rounded-2xl p-12 text-center
        cursor-pointer transition-all duration-200
        ${isDragActive
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                    : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
                }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
        >
            <input {...getInputProps()} />
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-500'}`} />
            <p className="text-lg font-medium text-gray-300">
                {isDragActive ? 'Drop it here!' : 'Drag & drop a file here'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
                or click to browse • Max {formatBytes(MAX_FILE_SIZE)}
            </p>
        </div>
    );
}