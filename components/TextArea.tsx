import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}
      </label>
      <textarea
        className={`w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#0077B5] focus:border-[#0077B5] min-h-[120px] text-sm ${className}`}
        {...props}
      />
      {helperText && <span className="text-xs text-gray-500">{helperText}</span>}
    </div>
  );
};
