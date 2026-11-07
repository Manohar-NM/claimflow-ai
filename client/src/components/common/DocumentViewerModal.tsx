import React from 'react';
import { Modal } from './Modal';
import { DocumentItem } from '../../types';
import { FileText, Download, Eye, ExternalLink } from 'lucide-react';

interface DocumentViewerModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  if (!document) return null;

  const fileUrl = `/api/documents/${document._id}/file`;
  const isPdf = document.mimeType === 'application/pdf';
  const isImage = document.mimeType.startsWith('image/');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.originalName}
      subtitle={`Type: ${document.documentType} • Size: ${(document.fileSize / 1024).toFixed(1)} KB • Version ${document.version}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <FileText className="h-4 w-4 text-brand-600" />
            <span>MIME: {document.mimeType}</span>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in New Tab</span>
            </a>
            <a
              href={fileUrl}
              download={document.originalName}
              className="flex items-center space-x-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 overflow-hidden min-h-[350px] flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-[450px] rounded-lg border border-slate-200 bg-white"
              title="PDF Preview"
            />
          ) : isImage ? (
            <img
              src={fileUrl}
              alt={document.originalName}
              className="max-h-[450px] max-w-full rounded-lg object-contain"
            />
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Preview not available for this MIME format.</p>
            </div>
          )}
        </div>

        {/* OCR / Extracted Text preview */}
        {document.extractedText && (
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Extracted Raw Document Text:
            </h4>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {document.extractedText}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
