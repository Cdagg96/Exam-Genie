import React from 'react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'Pending' | 'Denied' | null;
  email?: string;
}

export default function StatusModal({ isOpen, onClose, status, email }: StatusModalProps) {
  if (!isOpen || !status) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl w-[28rem] p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        {/* Pending Popup */}
        {status === 'Pending' ? (
          <>
            <div className="flex flex-col items-center mb-4">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h3>
              <p className="text-center text-gray-600 mb-4">
                Your account is still being reviewed by an admin.
              </p>
              <div className="p-4 w-full mb-4">
                <p className="text-sm text-700">
                  <strong>Next steps:</strong> You will receive an email notification once your account has been reviewed and approved. This process typically takes 1-2 business days.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
          {/* Denied Popup */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Denied</h3>
              <p className="text-center text-gray-600 mb-4">
                Your registration was not approved.
              </p>
              <div className="p-4 w-full mb-4">
                <p className="text-sm text-700 mb-2">
                  <strong>Possible reasons:</strong>
                </p>
                <ul className="text-sm text-700 list-disc pl-5 space-y-1">
                  <li>Unable to verify teacher/educational affiliation</li>
                  <li>Insufficient proof documentation</li>
                  <li>Invalid or unverifiable credentials</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}