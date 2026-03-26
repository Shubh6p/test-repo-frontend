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
            <div className="bg-retro-input border border-retro-shadow/20 shadow-brutal p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-retro-olive"></div>
                <div className="text-4xl mb-3">{getFileIcon(selectedFile.type)}</div>
                <p className="text-lg font-bold text-retro-text font-dos text-sm md:text-base break-all uppercase">
                    {selectedFile.name}
                </p>
                <p className="text-sm text-retro-gray mt-2 font-mono">
                    {formatBytes(selectedFile.size)}
                </p>
                {!disabled && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFileSelected(null);
                        }}
                        className="mt-6 text-xs text-retro-amber font-dos hover:text-retro-text transition-colors uppercase"
                    >
                        [X] REMOVE DATABLOCK
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`
        bg-retro-input border-2 border-dashed border-retro-gray/50 p-12 text-center
        cursor-pointer transition-all duration-200 shadow-brutal
        ${isDragActive
                    ? 'border-retro-olive bg-retro-olive/10'
                    : 'hover:border-retro-gray'
                }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
        >
            <input {...getInputProps()} />
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-retro-olive' : 'text-retro-gray'}`} />
            <p className="text-lg font-bold text-retro-text font-dos text-sm md:text-base uppercase leading-relaxed">
                {isDragActive ? 'DROP DATABLOCK!' : 'DRAG DATABLOCK HERE'}
            </p>
            <p className="text-sm text-retro-gray mt-4 font-mono uppercase">
                OR CLICK TO BROWSE - MAX {formatBytes(MAX_FILE_SIZE)}
            </p>
        </div>
    );
}