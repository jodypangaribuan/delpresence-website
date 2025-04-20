"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border border-gray-200 shadow-lg rounded-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
        </div>
        
        <div className="px-6 py-5">
          {/* Content */}
          <DialogDescription className="text-gray-700 text-base mb-2">
            {description}
            {itemName && (
              <span className="font-semibold text-gray-900 block mt-1">"{itemName}"</span>
            )}
          </DialogDescription>
          
          <p className="text-sm text-gray-500 mt-3 mb-2">
            Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
          </p>
        </div>
        
        {/* Footer with actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-row justify-end gap-3">
          <Button
            variant="outline"
            className="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 transition-colors"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menghapus...
              </>
            ) : (
              <>Hapus</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationModal; 